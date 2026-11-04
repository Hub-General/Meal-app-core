import { prisma } from "../db/prisma";
import { NotificationType } from "../enums/ENotificationTypes";
import {
  SelectionStatus,
  SelectionType,
  WeekMenuStatus,
} from "../generated/prisma";
import {
   getDateFromISOWeek,
  getISOWeekInfo,
} from "../helpers/dateFunctions";
import {
  CustomNotificationRequest,
  NotificationSubscriptionRequest,
} from "../schema/notification";
import { mealSelectionService } from "./mealSelectionService";
import { mailService } from "./emailService";
import { CustomNotifyUsersRequest } from "../schema/notification";
import { pushService } from "./pushService";
import { weekMenuScheduleService } from "./weekMenuScheduleService";

const pushSubscriptionSelect = {
  id: true,
  userId: true,
  endpoint: true,
  p256dh: true,
  auth: true,
} as const;

const activePushUsersFilter = {
  status: "ACTIVE",
  preferences: {
    pushNotifications: true,
  },
} as const;

const getActivePushSubscriptionsForUsers = async (userIds?: number[]) =>
  prisma.pushSubscription.findMany({
    where: {
      ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
      user: activePushUsersFilter,
    },
    select: pushSubscriptionSelect,
  });

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

    const subscriptions = await getActivePushSubscriptionsForUsers(unselectedUserIds);

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
    menuDayId?: number;
    excludedSelectionIds?: number[];
    title?: string;
    description?: string;
  }) => {
    let scheduleId = params?.weekMenuScheduleId;

    if (!scheduleId) {
      const currentWeek = getISOWeekInfo(new Date());
      const currentSchedule = await prisma.weekMenuSchedule.findFirst({
        where: { week: currentWeek.week, year: currentWeek.year },
        select: { id: true },
      });
      scheduleId = currentSchedule?.id;
    }

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

    // Find all users who have meal selections for this week schedule (excluding unfulfilled meals if specified)
    const selections = await prisma.selections.findMany({
      where: {
        weekMenuScheduleId: scheduleId,
        selectionType: SelectionType.MEAL,
        selectionStatus: { not: SelectionStatus.CANCELLED },
        ...(params?.menuDayId ? { menuDayId: params.menuDayId } : {}),
        ...(params?.excludedSelectionIds?.length
          ? { id: { notIn: params.excludedSelectionIds } }
          : {}),
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

    const subscriptions = await getActivePushSubscriptionsForUsers(recipientUserIds);

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
   * 3. Notify users that meal selections have been closed.
   * If closedAt is null (first close), sends to all active users with push notifications enabled.
   * If closedAt is not null (re-close after reopen), sends only to users who submitted or updated
   * selections after the recorded closedAt timestamp.
   */
  notifySelectionsClosed: async (params: {
    weekMenuScheduleId: number;
    closedAt?: Date | null;
  }) => {
    let recipientUserIds: number[] | undefined;

    if (params.closedAt) {
      const recent = await prisma.selections.findMany({
        where: {
          weekMenuScheduleId: params.weekMenuScheduleId,
          updatedAt: { gt: params.closedAt },
        },
        select: { createdFor: true, createdBy: true },
      });

      const userIds = [...new Set(recent.flatMap((s) => [s.createdFor, s.createdBy].filter(Boolean) as number[]))];
      if (!userIds.length) return { sent: 0 };
      recipientUserIds = userIds;
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        ...(recipientUserIds ? { userId: { in: recipientUserIds } } : {}),
        user: activePushUsersFilter,
      },
      select: {
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    if (!subscriptions.length) return { sent: 0 };

    return await pushService.sendBatch(subscriptions, {
      title: "Selections Closed",
      description: "Selections have been closed for this week you can no longer submit meal selections.",
      type: NotificationType.SELECTION_WINDOW_CLOSED,
      url: "/meal-selection",
    });
  },

  /**
   * 4. Send custom notification with custom title & description.
   * If recipientIds are provided, sends to only those recipient IDs.
   * If no recipientIds are provided, assumes internal filter and sends to all active users who have push notifications enabled.
   */
  notifyUsers: async (request: CustomNotificationRequest) => {
    const { recipientIds, title, description, type } = request;

    const hasRecipientIds = Boolean(recipientIds && recipientIds.length > 0);

    const subscriptions = hasRecipientIds
      ? await prisma.pushSubscription.findMany({
          where: { userId: { in: recipientIds! } },
          select: pushSubscriptionSelect,
        })
      : await getActivePushSubscriptionsForUsers();

    if (!subscriptions.length) {
      return {
        message: hasRecipientIds
          ? `Found ${recipientIds!.length} target user(s), but none have active push subscriptions`
          : "No active users with enabled push subscriptions found",
        recipientsCount: hasRecipientIds ? recipientIds!.length : 0,
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

    const targetCount = hasRecipientIds
      ? recipientIds!.length
      : new Set(subscriptions.map((s) => s.userId)).size;

    return {
      message: `Notification sent to ${result.sent} subscription(s) for ${targetCount} user(s)`,
      recipientsCount: targetCount,
      subscriptionsCount: subscriptions.length,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired,
    };
  },

  /**
   * Register or update a user's web push subscription.
   */
  /**
   * 5. Custom notify users via both Email and Web Push.
   * Takes userIds and notificationType (or title/message overrides).
   * Sends email to all resolved users regardless of user email preference setting.
   * Also sends push notification to users who have active push subscriptions.
   */
  customNotifyUsers: async (request: CustomNotifyUsersRequest) => {
    const { userIds, type, title: customTitle, message: customMessage, description: customDescription } = request;

    const targetUsers = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        referenceEmail: true,
        status: true,
      },
    });

    if (!targetUsers.length) {
      return {
        message: "No users found for the provided userIds",
        usersTargeted: 0,
        emails: { sent: 0, failed: 0 },
        push: { subscriptionsCount: 0, sent: 0, failed: 0 },
      };
    }

    const customBody = customMessage || customDescription;
    let resolvedTitle = customTitle;
    let resolvedBody = customBody;

    switch (type) {
      case NotificationType.MEAL_UNSELECTED_REMINDER:
      case NotificationType.SELECTION_REMINDER:
        resolvedTitle = resolvedTitle || "Selections closing soon";
        resolvedBody = resolvedBody || "You haven't submitted your meal selections yet. Please make your selections before the window closes!";
        break;
      case NotificationType.FOOD_ARRIVED:
      case NotificationType.MEAL_ARRIVAL:
        resolvedTitle = resolvedTitle || "Food is in!";
        resolvedBody = resolvedBody || "Your meal is ready for pickup.";
        break;
      case NotificationType.SELECTION_WINDOW_OPEN:
        resolvedTitle = resolvedTitle || "Meal selection window open";
        resolvedBody = resolvedBody || "The meal selection window is now open. You can select your meals now.";
        break;
      case NotificationType.SELECTION_WINDOW_CLOSED:
        resolvedTitle = resolvedTitle || "Meal selection window closed";
        resolvedBody = resolvedBody || "Meal selections for this week are now closed.";
        break;
      case NotificationType.PRESET_UPDATE:
        resolvedTitle = resolvedTitle || "Preset Item Unavailable";
        resolvedBody = resolvedBody || "A meal in your preset is no longer available. Please update your preset preferences.";
        break;
      default:
        resolvedTitle = resolvedTitle || "Meal App Notification";
        resolvedBody = resolvedBody || "You have an update regarding your meal selections.";
        break;
    }

    // Always send emails (ignoring email notifications preference toggle as requested)
    const emailPromises = targetUsers.map(async (user) => {
      const email = user.email ?? user.referenceEmail;
      if (!email) return false;
      return await mailService.sendNotificationEmail(
        email,
        user.name,
        resolvedTitle!,
        resolvedBody!
      );
    });

    const emailResults = await Promise.allSettled(emailPromises);
    const emailsSent = emailResults.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;
    const emailsFailed = targetUsers.length - emailsSent;

    // Send push notification to active subscriptions
    const foundUserIds = targetUsers.map((u) => u.id);
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: foundUserIds } },
      select: pushSubscriptionSelect,
    });

    let pushSent = 0;
    let pushFailed = 0;

    if (subscriptions.length > 0) {
      const pushResult = await pushService.sendBatch(subscriptions, {
        title: resolvedTitle!,
        description: resolvedBody!,
        type,
        url: "/meal-selection",
      });
      pushSent = pushResult.sent;
      pushFailed = pushResult.failed;
    }

    return {
      message: `Notification processed for ${targetUsers.length} user(s): ${emailsSent} email(s) sent, ${pushSent} push notification(s) sent across ${subscriptions.length} active subscription(s)`,
      type,
      usersTargeted: targetUsers.length,
      emails: {
        sent: emailsSent,
        failed: emailsFailed,
      },
      push: {
        subscriptionsCount: subscriptions.length,
        sent: pushSent,
        failed: pushFailed,
      },
    };
  },
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