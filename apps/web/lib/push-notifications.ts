/**
 * Push notification dispatch utility.
 *
 * Supports two transports:
 *  1. Web Push (VAPID) — browsers that have subscribed via the /api/push/subscribe endpoint
 *  2. FCM (Firebase Cloud Messaging) — future React Native mobile app tokens
 *
 * Required env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY   — generated via `npx web-push generate-vapid-keys`
 *   VAPID_PRIVATE_KEY              — same command
 *   VAPID_EMAIL                    — mailto:admin@yourdomain.com
 *   FCM_SERVER_KEY                 — from Firebase Console → Project Settings → Cloud Messaging
 */

import webpush from 'web-push';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Configure VAPID once on module load
if (
  process.env.VAPID_PRIVATE_KEY &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_EMAIL
) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch {
    // VAPID keys not configured — push notifications disabled
  }
}

/**
 * Send a web push notification to a single browser subscription.
 */
export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.VAPID_PRIVATE_KEY) {
    console.warn('[push] VAPID keys not configured — skipping web push');
    return { success: false, error: 'VAPID not configured' };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired — caller should remove it from storage
      return { success: false, error: 'subscription_expired' };
    }
    console.error('[push] web push failed', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send an FCM push notification to a device token (React Native mobile app).
 * Uses the legacy FCM v1 HTTP API.
 */
export async function sendFcmPush(
  deviceToken: string,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) {
    console.warn('[push] FCM_SERVER_KEY not configured — skipping FCM push');
    return { success: false, error: 'FCM not configured' };
  }

  const body = {
    to: deviceToken,
    notification: {
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      click_action: payload.url,
    },
    data: {
      ...payload.data,
      url: payload.url,
    },
  };

  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${serverKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[push] FCM error', res.status, text);
    return { success: false, error: `FCM HTTP ${res.status}` };
  }

  const json = await res.json();
  if (json.failure > 0) {
    const err = json.results?.[0]?.error;
    return { success: false, error: err || 'FCM delivery failed' };
  }

  return { success: true };
}

/**
 * Send a notification to all stored subscriptions for a business.
 * Expired subscriptions are returned so the caller can clean them up.
 */
export async function broadcastToSubscriptions(
  subscriptions: WebPushSubscription[],
  payload: PushPayload
): Promise<{ expired: WebPushSubscription[] }> {
  const expired: WebPushSubscription[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendWebPush(sub, payload);
      if (result.error === 'subscription_expired') {
        expired.push(sub);
      }
    })
  );

  return { expired };
}

// ── Pre-built notification templates ──────────────────────────────────────

export function appointmentReminderPayload(
  clientName: string,
  therapistName: string,
  timeStr: string
): PushPayload {
  return {
    title: 'Appointment Reminder',
    body: `${clientName} with ${therapistName} at ${timeStr}`,
    url: '/appointments',
    requireInteraction: true,
  };
}

export function newBookingPayload(clientName: string, serviceType: string): PushPayload {
  return {
    title: 'New Booking',
    body: `${clientName} booked ${serviceType}`,
    url: '/appointments',
  };
}

export function paymentReceivedPayload(amount: string, clientName: string): PushPayload {
  return {
    title: 'Payment Received',
    body: `${amount} from ${clientName}`,
    url: '/payments',
  };
}
