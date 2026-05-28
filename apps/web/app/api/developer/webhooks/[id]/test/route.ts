import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (_req, user, ctx) => {
  const id = ctx?.params?.id as string;
  const wh = await prisma.webhook.findUnique({ where: { id }, include: { business: { select: { ownerId: true } } } });
  if (!wh) return res.notFound();
  if (wh.business.ownerId !== user.id) return res.forbidden();

  // Emit a ping event directly to this webhook
  const payloadStr = JSON.stringify({ event: 'ping', webhookId: id, timestamp: new Date().toISOString(), data: {} });
  const { createHmac } = await import('crypto');
  const signature = createHmac('sha256', wh.secret).update(payloadStr).digest('hex');

  let statusCode: number | null = null;
  let succeeded = false;
  let body = '';
  try {
    const resp = await fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'ping',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Id': id,
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10_000),
    });
    statusCode = resp.status;
    body = (await resp.text().catch(() => '')).slice(0, 1000);
    succeeded = resp.ok;
  } catch {
    body = 'Request failed or timed out';
  }

  await prisma.webhookDelivery.create({
    data: { webhookId: id, event: 'ping', payload: { event: 'ping' }, statusCode, responseBody: body, succeeded },
  });

  return res.ok({ succeeded, statusCode, body });
});
