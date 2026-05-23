import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const status = searchParams.get('status');
  const channel = searchParams.get('channel');

  const promotions = await prisma.promotion.findMany({
    where: {
      businessId,
      ...(status && { status: status as any }),
      ...(channel && { channel: channel as any }),
    },
    include: {
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok(promotions);
});

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { businessId, name, description, channel, subject, bodyText, recipientFilter, scheduledFor } = body;

  if (!businessId || !name || !channel || !bodyText || !recipientFilter) {
    return res.badRequest('businessId, name, channel, bodyText, recipientFilter are required');
  }

  const promotion = await prisma.promotion.create({
    data: {
      businessId,
      name,
      description,
      channel,
      subject,
      body: bodyText,
      recipientFilter,
      status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    },
  });

  return res.created(promotion);
});
