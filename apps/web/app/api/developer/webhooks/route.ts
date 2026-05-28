import { randomBytes } from 'crypto';
import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/webhooks';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const owner = await prisma.business.findFirst({ where: { id: businessId, ownerId: user.id }, select: { id: true } });
  if (!owner) return res.forbidden();

  const webhooks = await prisma.webhook.findMany({
    where: { businessId },
    select: { id: true, url: true, events: true, isActive: true, lastTriggeredAt: true, failureCount: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok({ webhooks, availableEvents: WEBHOOK_EVENTS });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, url, events } = body;
  if (!businessId || !url || !events?.length) return res.badRequest('businessId, url, and events are required');

  const owner = await prisma.business.findFirst({ where: { id: businessId, ownerId: user.id }, select: { id: true } });
  if (!owner) return res.forbidden();

  try { new URL(url); } catch { return res.badRequest('Invalid URL'); }

  const invalid = (events as string[]).filter(e => e !== '*' && !WEBHOOK_EVENTS.includes(e as WebhookEvent));
  if (invalid.length) return res.badRequest(`Unknown events: ${invalid.join(', ')}`);

  const secret = randomBytes(32).toString('hex');
  const webhook = await prisma.webhook.create({
    data: { businessId, url, events, secret },
    select: { id: true, url: true, events: true, isActive: true, secret: true, createdAt: true },
  });

  // Return secret only on creation
  return res.created(webhook);
});
