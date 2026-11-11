import { prisma } from "../db/prisma";
import { NotificationType } from "../enums/ENotificationTypes";
import {
  FulfillmentStatus,
  SelectionStatus,
  SelectionType,
} from "../generated/prisma";
import {
  CustomNotificationRequest,
  CustomNotifyUsersRequest,
  NotificationSubscriptionRequest,
  UnselectedReminderRequest,
} from "../schema/notification";
import { mailService } from "./emailService";
import { mealSelectionService } from "./mealSelectionService";
import { pushService } from "./pushService";

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

const DEFAULT_TEMPLATE = {
  title: "Meal App Notification",
  body: "You have an update regarding your meal selections.",
};

const NOTIFICATION_TEMPLATES: Partial<
  Record<NotificationType, { title: string; body: string }>
> = {
  [NotificationType.MEAL_UNSELECTED_REMINDER]: {
    title: "Selections closing soon",
    body: "Select your meals now!",
  },
  [NotificationType.SELECTION_REMINDER]: {
    title: "Selections closing soon",
    body: "You haven't submitted your meal selections yet. Please make your selections before the window closes!",
  },
  [NotificationType.FOOD_ARRIVED]: {
    title: "Food is in!",
    body: "Your meal is ready for pickup.",
  },
  [NotificationType.MEAL_ARRIVAL]: {
    title: "Food is in!",
    body: "Your meal is ready for pickup.",
  },
  [NotificationType.SELECTION_WINDOW_OPEN]: {
    title: "Meal selection window open",
    body: "The meal selection window is now open. You can select your meals now.",
  },
  [NotificationType.SELECTION_WINDOW_CLOSED]: {
    title: "Selections Closed",
    body: "Selections have been closed for this week you can no longer submit meal selections.",
  },
  [NotificationType.PRESET_UPDATE]: {
    title: "Preset Item Unavailable",
    body: "A meal in your preset is no longer available. Please update your preset preferences.",
  },
};

function resolveTemplate(
  type: NotificationType,
  customTitle?: string,
  customBody?: string
) {
  const base = NOTIFICATION_TEMPLATES[type] ?? DEFAULT_TEMPLATE;
  return {
    title: customTitle || base.title,
    body: customBody || base.body,
  };
}

async function getActivePushSubscriptionsForUsers(userIds?: number[]) {
  return prisma.pushSubscription.findMany({
    where: {
      ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
      user: activePushUsersFilter,
    },
    select: pushSubscriptionSelect,
  });
}

async function dispatchPushToUsers(
  userIds: number[] | undefined,
  payload: {
    title: string;
    description?: string;
    type: NotificationType;
    url?: string;
  }
) {
  const subscriptions = await getActivePushSubscriptionsForUsers(userIds);
  if (!subscriptions.length) {
    return {
      subscriptionsCount: 0,
      uniqueRecipientsCount: 0,
      sent: 0,
      failed: 0,
      expired: 0,
    };
  }

  const result = await pushService.sendBatch(subscriptions, payload);
  return {
    subscriptionsCount: subscriptions.length,
    uniqueRecipientsCount: new Set(subscriptions.map((s) => s.userId)).size,
    sent: result.sent,
    failed: result.failed,
    expired: result.expired,
  };
}

export const notificationService = {
  /**
   * 1. Notify all active users who haven't selected their meals for the week.
   */
  notifyUnselectedUsers: async (params?: UnselectedReminderRequest) => {
    const targetDate = params?.date ? new Date(params.date) : new Date();
    const unselectedUsers = await mealSelectionService.getUsersWithoutSelections(
      targetDate,
      5,
      params?.weekMenuScheduleId
    );

    if (!unselectedUsers.length) {
      return {
        message: "No unselected users found to notify",
        targetUsersCount: 0,
        subscriptionsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    const { title, body: description } = resolveTemplate(
      NotificationType.MEAL_UNSELECTED_REMINDER,
      params?.title,
      params?.description
    );

    const unselectedUserIds = unselectedUsers.map((u) => u.id);
    const result = await dispatchPushToUsers(unselectedUserIds, {
      title,
      description,
      type: NotificationType.MEAL_UNSELECTED_REMINDER,
      url: "/meal-selection",
    });

    if (!result.subscriptionsCount) {
      return {
        message: `Found ${unselectedUsers.length} unselected user(s), but none have active push subscriptions with notifications enabled`,
        targetUsersCount: unselectedUsers.length,
        subscriptionsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    return {
      message: `Sent unselected reminders to ${result.sent} subscription(s) across ${unselectedUsers.length} user(s)`,
      targetUsersCount: unselectedUsers.length,
      subscriptionsCount: result.subscriptionsCount,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired,
    };
  },

  /**
   * 2. Broadcast that meals are ready / food is in.
   * Targets users who have fulfilled meal selections for the given schedule/day and have push notifications enabled.
   */
  notifyFoodArrived: async (params: {
    weekMenuScheduleId: number;
    menuDayId?: number;
    excludedSelectionIds?: number[];
    title?: string;
    description?: string;
  }) => {
    const selections = await prisma.selections.findMany({
      where: {
        weekMenuScheduleId: params.weekMenuScheduleId,
        selectionType: SelectionType.MEAL,
        selectionStatus: { not: SelectionStatus.CANCELLED },
        fulfillmentStatus: { not: FulfillmentStatus.NOT_FULFILLED },
        ...(params.menuDayId ? { menuDayId: params.menuDayId } : {}),
        ...(params.excludedSelectionIds?.length
          ? { id: { notIn: params.excludedSelectionIds } }
          : {}),
      },
      select: {
        createdFor: true,
        createdBy: true,
      },
    });

    const recipientUserIds = Array.from(
      new Set(
        selections
          .map((sel) => sel.createdFor ?? sel.createdBy)
          .filter((id): id is number => Boolean(id))
      )
    );

    if (!recipientUserIds.length) {
      return {
        message: "No users have active meal selections for this schedule",
        recipientsCount: 0,
        sent: 0,
        failed: 0,
      };
    }

    const { title, body: description } = resolveTemplate(
      NotificationType.FOOD_ARRIVED,
      params.title,
      params.description
    );

    const result = await dispatchPushToUsers(recipientUserIds, {
      title,
      description,
      type: NotificationType.FOOD_ARRIVED,
      url: "/meal-selection",
    });

    if (!result.subscriptionsCount) {
      return {
        message: `Found ${recipientUserIds.length} user(s) with meal selections, but none have active push subscriptions`,
        recipientsCount: recipientUserIds.length,
        sent: 0,
        failed: 0,
      };
    }

    return {
      message: `Food arrival broadcast sent to ${result.sent} subscription(s) for ${recipientUserIds.length} recipient(s)`,
      recipientsCount: recipientUserIds.length,
      subscriptionsCount: result.subscriptionsCount,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired,
    };
  },

  /**
   * 3. Notify users that meal selections have been closed.
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

      const userIds = [
        ...new Set(
          recent
            .flatMap((s) => [s.createdFor, s.createdBy])
            .filter((id): id is number => Boolean(id))
        ),
      ];
      if (!userIds.length) return { sent: 0 };
      recipientUserIds = userIds;
    }

    const { title, body: description } = resolveTemplate(
      NotificationType.SELECTION_WINDOW_CLOSED
    );

    return dispatchPushToUsers(recipientUserIds, {
      title,
      description,
      type: NotificationType.SELECTION_WINDOW_CLOSED,
      url: "/meal-selection",
    });
  },

  /**
   * 4. Send custom push notification.
   * If recipientIds are provided, targets only those active users with push notifications enabled;
   * otherwise broadcasts to all active users with push notifications enabled.
   */
  notifyUsers: async (request: CustomNotificationRequest) => {
    const { recipientIds, title, description, type } = request;
    const hasRecipientIds = Boolean(recipientIds && recipientIds.length > 0);

    const result = await dispatchPushToUsers(
      hasRecipientIds ? recipientIds : undefined,
      {
        title,
        description,
        type: type || NotificationType.FEEDBACK_REPLY,
      }
    );

    if (!result.subscriptionsCount) {
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

    const targetCount = hasRecipientIds
      ? recipientIds!.length
      : result.uniqueRecipientsCount;

    return {
      message: `Notification sent to ${result.sent} subscription(s) for ${targetCount} user(s)`,
      recipientsCount: targetCount,
      subscriptionsCount: result.subscriptionsCount,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired,
    };
  },

  /**
   * 5. Custom notify users via both Email and Web Push in parallel.
   * Sends email to all resolved users regardless of user email preference setting,
   * and push notifications to their active push subscriptions.
   */
  customNotifyUsers: async (request: CustomNotifyUsersRequest) => {
    const {
      userIds,
      type,
      title: customTitle,
      message: customMessage,
      description: customDescription,
    } = request;

    const [targetUsers, subscriptions] = await Promise.all([
      prisma.users.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          referenceEmail: true,
        },
      }),
      prisma.pushSubscription.findMany({
        where: { userId: { in: userIds } },
        select: pushSubscriptionSelect,
      }),
    ]);

    if (!targetUsers.length) {
      return {
        message: "No users found for the provided userIds",
        usersTargeted: 0,
        emails: { sent: 0, failed: 0 },
        push: { subscriptionsCount: 0, sent: 0, failed: 0 },
      };
    }

    const { title: resolvedTitle, body: emailBody } = resolveTemplate(
      type,
      customTitle,
      customMessage || customDescription
    );
    const { body: pushBody } = resolveTemplate(
      type,
      customTitle,
      customDescription || customMessage
    );

    const [emailResults, pushResult] = await Promise.all([
      Promise.allSettled(
        targetUsers.map(async (user) => {
          const email = user.email ?? user.referenceEmail;
          if (!email) return false;
          return mailService.sendNotificationEmail(
            email,
            user.name,
            resolvedTitle,
            emailBody
          );
        })
      ),
      subscriptions.length > 0
        ? pushService.sendBatch(subscriptions, {
            title: resolvedTitle,
            description: pushBody,
            type,
            url: "/meal-selection",
          })
        : Promise.resolve({ total: 0, sent: 0, failed: 0, expired: 0 }),
    ]);

    const emailsSent = emailResults.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;
    const emailsFailed = targetUsers.length - emailsSent;

    return {
      message: `Notification processed for ${targetUsers.length} user(s): ${emailsSent} email(s) sent, ${pushResult.sent} push notification(s) sent across ${subscriptions.length} active subscription(s)`,
      type,
      usersTargeted: targetUsers.length,
      emails: {
        sent: emailsSent,
        failed: emailsFailed,
      },
      push: {
        subscriptionsCount: subscriptions.length,
        sent: pushResult.sent,
        failed: pushResult.failed,
      },
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
