import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, _user, ctx) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const promotion = await prisma.promotion.findFirst({
    where: { id: ctx.params.id, businessId },
    include: {
      _count: { select: { recipients: true } },
    },
  });
  if (!promotion) return res.notFound('Promotion not found');

  const recipientStats = await prisma.promotionRecipient.groupBy({
    by: ['status'],
    where: { promotionId: promotion.id },
    _count: { status: true },
  });

  const stats: Record<string, number> = {};
  for (const s of recipientStats) {
    stats[s.status] = s._count.status;
  }

  return res.ok({
    promotionId: promotion.id,
    name: promotion.name,
    status: promotion.status,
    channel: promotion.channel,
    totalRecipients: (promotion as any)._count.recipients,
    totalSent: promotion.totalSent,
    totalOpened: promotion.totalOpened,
    totalClicked: promotion.totalClicked,
    totalConverted: promotion.totalConverted,
    byStatus: stats,
    openRate: promotion.totalSent > 0 ? (promotion.totalOpened / promotion.totalSent) * 100 : 0,
    clickRate: promotion.totalSent > 0 ? (promotion.totalClicked / promotion.totalSent) * 100 : 0,
    conversionRate: promotion.totalSent > 0 ? (promotion.totalConverted / promotion.totalSent) * 100 : 0,
  });
});
