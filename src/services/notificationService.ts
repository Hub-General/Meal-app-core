import { prisma } from "../db/prisma";
import {
  NotificationType,
} from "../enums/ENotificationTypes";
import {
  SelectionStatus,
  SelectionType,
  WeekMenuStatus,
} from "../generated/prisma";
import { getDateFromISOWeek } from "../helpers/dateFunctions";
import {
  CustomNotificationRequest,
  NotificationSubscriptionRequest,
} from "../schema/notification";
import { mealSelectionService } from "./mealSelectionService";
import { pushService } from "./pushService";
import { weekMenuScheduleService } from "./weekMenuScheduleService";

export const notificationService = {
  /**
   * 1. Notify all active users who haven't selected their meals for the week.
   * Default title: "Selections closing soon", description: "Select your meals now!"
   */
  notifyUnselectedUsers: async (params?: {
    weekMenuScheduleId?: number;
    date?: Date;
    title?: string;
    description?: string;
  }) => {
    let targetDate = params?.date ? new Date(params.date) : new Date();

    if (params?.weekMenuScheduleId) {
      const schedule = await weekMenuScheduleService.getWeekMenuScheduleById(
        params.weekMenuScheduleId
      );
      if (schedule) {
        targetDate = getDateFromISOWeek(schedule.week, schedule.year);
      }
    }

    // Get active users who haven't selected meals
    const unselectedUsers = await mealSelectionService.getUsersWithoutSelections(targetDate);
    if (!unselectedUsers.length) {
      return {
        message: "No unselected users found to notify",
        targetUsersCount: 0,
        subscriptionsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    const unselectedUserIds = unselectedUsers.map((u) => u.id);

    // Filter to users who have push notifications enabled and active push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: unselectedUserIds },
        user: {
          status: "ACTIVE",
          OR: [
            { preferences: null },
            { preferences: { pushNotifications: true } },
          ],
        },
      },
      select: {
        id: true,
        userId: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    if (!subscriptions.length) {
      return {
        message: `Found ${unselectedUsers.length} unselected user(s), but none have active push subscriptions with notifications enabled`,
        targetUsersCount: unselectedUsers.length,
        subscriptionsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    const title = params?.title || "Selections closing soon";
    const description = params?.description || "Select your meals now!";

    const result = await pushService.sendBatch(subscriptions, {
      title,
      description,
      type: NotificationType.MEAL_UNSELECTED_REMINDER,
      url: "/meal-selection",
    });

    return {
      message: `Sent unselected reminders to ${result.sent} subscription(s) across ${unselectedUsers.length} user(s)`,
      targetUsersCount: unselectedUsers.length,
      subscriptionsCount: subscriptions.length,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired,
    };
  },

  /**
   * 2. Broadcast that meals are ready / food is in.
   * Only targets users who have selected food within the week/schedule and have push notifications enabled.
   */
  notifyFoodArrived: async (params?: {
    weekMenuScheduleId?: number;
    title?: string;
    description?: string;
  }) => {
    let scheduleId = params?.weekMenuScheduleId;

    if (!scheduleId) {
      const activeSchedule = await prisma.weekMenuSchedule.findFirst({
        where: { status: WeekMenuStatus.ACTIVE },
        select: { id: true },
      });
      scheduleId = activeSchedule?.id;
    }

    if (!scheduleId) {
      return {
        message: "No active week menu schedule found to broadcast food arrival",
        recipientsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    // Find all users who have meal selections for this week schedule
    const selections = await prisma.selections.findMany({
      where: {
        weekMenuScheduleId: scheduleId,
        selectionType: SelectionType.MEAL,
        selectionStatus: { not: SelectionStatus.CANCELLED },
      },
      select: {
        createdFor: true,
        createdBy: true,
      },
    });

    const userIdsSet = new Set<number>();
    for (const sel of selections) {
      if (sel.createdFor) userIdsSet.add(sel.createdFor);
      else if (sel.createdBy) userIdsSet.add(sel.createdBy);
    }

    const recipientUserIds = Array.from(userIdsSet);
    if (!recipientUserIds.length) {
      return {
        message: "No users have active meal selections for this schedule",
        recipientsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    // Filter by preferences.pushNotifications !== false
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: recipientUserIds },
        user: {
          status: "ACTIVE",
          OR: [
            { preferences: null },
            { preferences: { pushNotifications: true } },
          ],
        },
      },
      select: {
        id: true,
        userId: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    if (!subscriptions.length) {
      return {
        message: `Found ${recipientUserIds.length} user(s) with meal selections, but none have active push subscriptions`,
        recipientsCount: recipientUserIds.length,
        sent: 0,
        failed: 0,
      };
    }

    const title = params?.title || "Food is in!";
    const description = params?.description || "Your meal is ready for pickup.";

    const result = await pushService.sendBatch(subscriptions, {
      title,
      description,
      type: NotificationType.FOOD_ARRIVED,
      url: "/meal-selection",
    });

    return {
      message: `Food arrival broadcast sent to ${result.sent} subscription(s) for ${recipientUserIds.length} recipient(s)`,
      recipientsCount: recipientUserIds.length,
      subscriptionsCount: subscriptions.length,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired,
    };
  },

  /**
   * 3. Send custom notification with custom title & description to a specific array of users.
   */
  notifyUsers: async (request: CustomNotificationRequest) => {
    const { recipientIds, title, description, type } = request;

    if (!recipientIds.length) {
      return {
        message: "No recipient IDs provided",
        recipientsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: recipientIds },
        user: {
          status: "ACTIVE",
          OR: [
            { preferences: null },
            { preferences: { pushNotifications: true } },
          ],
        },
      },
      select: {
        id: true,
        userId: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    if (!subscriptions.length) {
      return {
        message: `Found ${recipientIds.length} target user(s), but none have active push subscriptions`,
        recipientsCount: recipientIds.length,
        subscriptionsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    const result = await pushService.sendBatch(subscriptions, {
      title,
      description,
      type: type || NotificationType.FEEDBACK_REPLY,
    });

    return {
      message: `Notification sent to ${result.sent} subscription(s) for ${recipientIds.length} user(s)`,
      recipientsCount: recipientIds.length,
      subscriptionsCount: subscriptions.length,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired,
    };
  },

  /**
   * Register or update a user's web push subscription.
   */
  createSubscription: async (
    userId: number,
    data: NotificationSubscriptionRequest
  ) => {
    return prisma.pushSubscription.upsert({
      where: {
        endpoint: data.endpoint,
      },
      update: {
        userId,
        p256dh: data.p256dh,
        auth: data.auth,
      },
      create: {
        userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
      },
    });
  },

  /**
   * Remove a user's web push subscription.
   */
  unsubscribe: async (userId: number, endpoint: string) => {
    return prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });
  },
};