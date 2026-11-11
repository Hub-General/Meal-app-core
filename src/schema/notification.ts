import { z } from "zod";
import { foodArrivalSchema, FoodArrivalRequest } from "./mealSelection";
import { NotificationType } from "../enums/ENotificationTypes";

export const NotificationSubscriptionRequestSchema = z.object({
  endpoint: z.string().url("Invalid push subscription endpoint"),
  p256dh: z.string().min(1, "p256dh key is required"),
  auth: z.string().min(1, "auth secret is required"),
});

export const UnsubscribeRequestSchema = z.object({
  endpoint: z.string().url("Invalid push subscription endpoint"),
});

export const CustomNotificationRequestSchema = z.object({
  type: z.nativeEnum(NotificationType).default(NotificationType.FEEDBACK_REPLY),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  recipientIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const BroadcastFoodArrivedSchema = foodArrivalSchema;
export type BroadcastFoodArrivedRequest = FoodArrivalRequest;

export const UnselectedReminderSchema = z.object({
  weekMenuScheduleId: z.coerce.number().int().positive().optional(),
  date: z.coerce.date().optional(),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export type NotificationSubscriptionRequest = z.infer<
  typeof NotificationSubscriptionRequestSchema
>;
export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;
export type CustomNotificationRequest = z.infer<
  typeof CustomNotificationRequestSchema
>;
export type UnselectedReminderRequest = z.infer<
  typeof UnselectedReminderSchema
>;

export const CustomNotifyUsersRequestSchema = z.object({
  userIds: z.array(z.coerce.number().int().positive()).min(1, "At least one userId is required"),
  type: z.nativeEnum(NotificationType),
  title: z.string().trim().optional(),
  message: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export type CustomNotifyUsersRequest = z.infer<typeof CustomNotifyUsersRequestSchema>;
