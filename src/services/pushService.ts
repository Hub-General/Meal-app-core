import webpush, { WebPushError } from "web-push";
import { prisma } from "../db/prisma";
import { NotificationType } from "../enums/ENotificationTypes";

let isVapidInitialized = false;

function initializeVapid(): boolean {
  if (isVapidInitialized) return true;

  const subject = process.env.VAPID_SUBJECT || "mailto:admin@mealapp-omega.vercel.app";
  const publicKey = (process.env.VPD_PUB_KEY || process.env.VAPID_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.VPD_PRIV_KEY || process.env.VAPID_PRIVATE_KEY || "").trim();

  if (!publicKey || !privateKey) {
    console.warn("[PushService] VAPID keys are missing. Push notifications are disabled.");
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidInitialized = true;
    return true;
  } catch (error) {
    console.error("[PushService] Failed to initialize VAPID details:", error);
    return false;
  }
}

export interface PushSubscriptionItem {
  id?: number;
  userId?: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  description?: string;
  type?: NotificationType;
  url?: string;
  data?: Record<string, any>;
}

export const pushService = {
  send: async (
    subscription: PushSubscriptionItem,
    payload: PushPayload
  ): Promise<{ success: boolean; expired?: boolean; error?: any }> => {
    if (!initializeVapid()) {
      return { success: false, error: "VAPID not configured" };
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.description || "",
          icon: "/icon.png",
          badge: "/badge.png",
          data: {
            type: payload.type,
            url: payload.url || "/",
            ...payload.data,
          },
        })
      );

      return { success: true };
    } catch (error: any) {
      // If endpoint is expired or unsubscribed (404 Not Found or 410 Gone), prune from DB
      const statusCode = error instanceof WebPushError ? error.statusCode : error?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        console.info(`[PushService] Removing expired subscription for endpoint: ${subscription.endpoint}`);
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        }).catch((e) => console.error("[PushService] Failed to clean up expired subscription:", e));
        return { success: false, expired: true };
      }

      console.error("[PushService] Failed to send push notification:", error?.message || error);
      return { success: false, error };
    }
  },

  sendBatch: async (
    subscriptions: PushSubscriptionItem[],
    payload: PushPayload,
    concurrency = 25
  ): Promise<{ total: number; sent: number; failed: number; expired: number }> => {
    let sent = 0;
    let failed = 0;
    let expired = 0;

    for (let i = 0; i < subscriptions.length; i += concurrency) {
      const chunk = subscriptions.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        chunk.map((sub) => pushService.send(sub, payload))
      );

      for (const res of results) {
        if (res.status === "fulfilled") {
          if (res.value.success) {
            sent++;
          } else if (res.value.expired) {
            expired++;
            failed++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      }
    }

    return { total: subscriptions.length, sent, failed, expired };
  },
};