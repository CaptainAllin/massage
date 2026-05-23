import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, _user, ctx) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const promotion = await prisma.promotion.findFirst({
    where: { id: ctx.params.id, businessId },
    include: {
      recipients: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { recipients: true } },
    },
  });

  if (!promotion) return res.notFound('Promotion not found');
  return res.ok(promotion);
});

export const PUT = withAuth(async (req, _user, ctx) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const existing = await prisma.promotion.findFirst({ where: { id: ctx.params.id, businessId } });
  if (!existing) return res.notFound('Promotion not found');
  if (existing.status === 'SENT' || existing.status === 'SENDING') {
    return res.badRequest('Cannot edit a promotion that has already been sent');
  }

  const body = await req.json();
  const { name, description, channel, subject, bodyText, recipientFilter, scheduledFor, status } = body;

  const promotion = await prisma.promotion.update({
    where: { id: ctx.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(channel !== undefined && { channel }),
      ...(subject !== undefined && { subject }),
      ...(bodyText !== undefined && { body: bodyText }),
      ...(recipientFilter !== undefined && { recipientFilter }),
      ...(scheduledFor !== undefined && { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }),
      ...(status !== undefined && { status }),
    },
  });

  return res.ok(promotion);
});

export const DELETE = withAuth(async (req, _user, ctx) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const existing = await prisma.promotion.findFirst({ where: { id: ctx.params.id, businessId } });
  if (!existing) return res.notFound('Promotion not found');
  if (existing.status === 'SENDING') {
    return res.badRequest('Cannot delete a promotion that is currently sending');
  }

  await prisma.promotion.delete({ where: { id: ctx.params.id } });
  return res.ok({ deleted: true });
});
