import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/webhooks';

export const DELETE = withAuth(async (_req, user, ctx) => {
  const id = ctx?.params?.id as string;
  const wh = await prisma.webhook.findUnique({ where: { id }, include: { business: { select: { ownerId: true } } } });
  if (!wh) return res.notFound();
  if (wh.business.ownerId !== user.id) return res.forbidden();
  await prisma.webhook.delete({ where: { id } });
  return res.ok({ id });
});

export const PATCH = withAuth(async (req, user, ctx) => {
  const id = ctx?.params?.id as string;
  const body = await req.json();
  const wh = await prisma.webhook.findUnique({ where: { id }, include: { business: { select: { ownerId: true } } } });
  if (!wh) return res.notFound();
  if (wh.business.ownerId !== user.id) return res.forbidden();

  if (body.events) {
    const invalid = (body.events as string[]).filter(e => e !== '*' && !WEBHOOK_EVENTS.includes(e as WebhookEvent));
    if (invalid.length) return res.badRequest(`Unknown events: ${invalid.join(', ')}`);
  }

  const updated = await prisma.webhook.update({
    where: { id },
    data: {
      url: body.url ?? undefined,
      events: body.events ?? undefined,
      isActive: body.isActive ?? undefined,
    },
    select: { id: true, url: true, events: true, isActive: true, lastTriggeredAt: true, failureCount: true },
  });
  return res.ok(updated);
});
