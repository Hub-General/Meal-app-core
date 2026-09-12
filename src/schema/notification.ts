import { z } from "zod";
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
  recipientIds: z.array(z.coerce.number().int().positive()).min(1, "At least one recipient ID is required"),
});

export const BroadcastFoodArrivedSchema = z.object({
  weekMenuScheduleId: z.coerce.number().int().positive().optional(),
  title: z.string().trim().default("Food is in!"),
  description: z.string().trim().default("Your meal is ready for pickup."),
});

export const UnselectedReminderSchema = z.object({
  weekMenuScheduleId: z.coerce.number().int().positive().optional(),
  date: z.coerce.date().optional(),
  title: z.string().trim().default("Selections closing soon"),
  description: z.string().trim().default("Select your meals now!"),
});

export type NotificationSubscriptionRequest = z.infer<
  typeof NotificationSubscriptionRequestSchema
>;
export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;
export type CustomNotificationRequest = z.infer<
  typeof CustomNotificationRequestSchema
>;
export type BroadcastFoodArrivedRequest = z.infer<
  typeof BroadcastFoodArrivedSchema
>;
export type UnselectedReminderRequest = z.infer<
  typeof UnselectedReminderSchema
>;
