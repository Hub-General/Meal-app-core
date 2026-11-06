import { Request, Response } from "express";
import {
  BroadcastFoodArrivedSchema,
  CustomNotificationRequestSchema,
  NotificationSubscriptionRequestSchema,
  UnsubscribeRequestSchema,
  UnselectedReminderSchema,
  CustomNotifyUsersRequestSchema,
} from "../schema/notification";
import { notificationService } from "../services/notificationService";
import { mealSelectionController } from "./mealSelectionController";

export const notificationController = {
  customNotifyUsersController: async (req: Request, res: Response) => {
    try {
      const parsed = CustomNotifyUsersRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid custom notify users payload",
          errors: parsed.error.flatten(),
        });
      }

      const result = await notificationService.customNotifyUsers(parsed.data);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to send notifications to users",
        error: error.message || error,
      });
    }
  },
  subscribeController: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const parsed = NotificationSubscriptionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid push subscription payload",
          errors: parsed.error.flatten(),
        });
      }

      const subscription = await notificationService.createSubscription(
        userId,
        parsed.data
      );
      return res.status(201).json({
        message: "Push subscription registered successfully",
        subscription,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to register push subscription",
        error: error.message || error,
      });
    }
  },

  unsubscribeController: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const parsed = UnsubscribeRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid unsubscribe payload",
          errors: parsed.error.flatten(),
        });
      }

      const result = await notificationService.unsubscribe(
        userId,
        parsed.data.endpoint
      );
      return res.status(200).json({
        message: "Unsubscribed successfully",
        count: result.count,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to unsubscribe",
        error: error.message || error,
      });
    }
  },

  broadcastFoodArrivedController: mealSelectionController.foodArrivalController,

  sendUnselectedReminderController: async (req: Request, res: Response) => {
    try {
      const parsed = UnselectedReminderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid reminder payload",
          errors: parsed.error.flatten(),
        });
      }

      const result = await notificationService.notifyUnselectedUsers(parsed.data);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to send unselected reminders",
        error: error.message || error,
      });
    }
  },

  sendCustomNotificationController: async (req: Request, res: Response) => {
    try {
      const parsed = CustomNotificationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid custom notification payload",
          errors: parsed.error.flatten(),
        });
      }

      const result = await notificationService.notifyUsers(parsed.data);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to send custom notification",
        error: error.message || error,
      });
    }
  },
};
