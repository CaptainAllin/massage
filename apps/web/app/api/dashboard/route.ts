import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getSmsCreditStatus } from '@/lib/sms-credits';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [todayAppointments, clientCount, currentRevenue, previousRevenue, serviceMixRaw, smsCredits] =
    await Promise.all([
      prisma.appointment.findMany({
        where: { businessId, startTime: { gte: todayStart, lt: tomorrowStart } },
        include: { client: true, therapist: { include: { user: true } } },
        orderBy: { startTime: 'asc' },
        take: 20,
      }),
      prisma.client.count({ where: { businessId, isActive: true } }),
      prisma.payment.aggregate({
        where: { businessId, status: 'COMPLETED', paidAt: { gte: thirtyDaysAgo, lte: now } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { businessId, status: 'COMPLETED', paidAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      prisma.appointment.groupBy({
        by: ['serviceType'],
        where: { businessId, startTime: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } },
        _count: { id: true },
      }),
      getSmsCreditStatus(businessId),
    ]);

  const totalRevenue = currentRevenue._sum.amount ?? 0;
  const previousTotal = previousRevenue._sum.amount ?? 0;
  const revenueGrowth =
    previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : 0;

  return res.ok({
    todayAppointments,
    clientCount,
    revenue: { totalRevenue, revenueGrowth },
    serviceMix: serviceMixRaw
      .map((s) => ({ serviceType: s.serviceType ?? 'Unknown', count: s._count.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    smsCredits,
  });
});
