import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';

export type WebhookEvent =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'client.created'
  | 'client.updated'
  | 'invoice.paid'
  | 'invoice.created'
  | 'treatment_note.completed'
  | 'ping';

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  'appointment.created',
  'appointment.updated',
  'appointment.cancelled',
  'client.created',
  'client.updated',
  'invoice.paid',
  'invoice.created',
  'treatment_note.completed',
];

const MAX_FAILURES = 10;
const MAX_RETRIES = 5;
const RETRY_DELAYS_MS = [0, 5_000, 30_000, 120_000, 300_000];

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

async function deliverOnce(
  webhookId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  payload: object
): Promise<{ succeeded: boolean; statusCode: number | null; body: string }> {
  const payloadStr = JSON.stringify(payload);
  const signature = sign(secret, payloadStr);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Id': webhookId,
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10_000),
    });
    const body = await resp.text().catch(() => '');
    return { succeeded: resp.ok, statusCode: resp.status, body: body.slice(0, 1000) };
  } catch {
    return { succeeded: false, statusCode: null, body: 'Request failed or timed out' };
  }
}

export async function emitWebhookEvent(businessId: string, event: WebhookEvent, data: object): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: { businessId, isActive: true },
    select: { id: true, url: true, secret: true, events: true, failureCount: true },
  });

  const subscribed = webhooks.filter(wh => {
    const events = wh.events as string[];
    return events.includes('*') || events.includes(event);
  });

  if (!subscribed.length) return;

  const payload = { event, businessId, timestamp: new Date().toISOString(), data };

  await Promise.allSettled(
    subscribed.map(wh => deliverWithRetry(wh.id, wh.url, wh.secret, event, payload))
  );
}

async function deliverWithRetry(
  webhookId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  payload: object
): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    const result = await deliverOnce(webhookId, url, secret, event, payload);

    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload,
        statusCode: result.statusCode,
        responseBody: result.body,
        succeeded: result.succeeded,
      },
    });

    if (result.succeeded) {
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { lastTriggeredAt: new Date(), failureCount: 0 },
      });
      return;
    }
  }

  // All retries exhausted — increment failure count
  const updated = await prisma.webhook.update({
    where: { id: webhookId },
    data: { failureCount: { increment: 1 } },
    select: { failureCount: true },
  });

  if (updated.failureCount >= MAX_FAILURES) {
    await prisma.webhook.update({ where: { id: webhookId }, data: { isActive: false } });
  }
}
