import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getSmsCreditStatus } from '@/lib/sms-credits';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const SLOT_NAMES = ['morning', 'midday', 'afternoon', 'evening'] as const;

function getSlot(hour: number): typeof SLOT_NAMES[number] {
  if (hour < 12) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

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
  const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);

  // Current week: Monday 00:00 through Sunday 23:59
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Current month start
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 28 days ago (for dueBack)
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const [
    todayAppointments,
    clientCount,
    currentRevenue,
    previousRevenue,
    serviceMixRaw,
    smsCredits,
    collectedTodayAgg,
    todayCompletedCount,
    newClientsThisWeek,
    noShowsThisWeek,
    weekAppointments,
    last60DaysAppointments,
    heatmapAppointments,
    topServicesThisMonth,
    dueBackClients,
  ] = await Promise.all([
    // existing
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

    // collectedToday
    prisma.payment.aggregate({
      where: { businessId, status: 'COMPLETED', paidAt: { gte: todayStart, lt: tomorrowStart } },
      _sum: { amount: true },
    }),
    // todayCompletedCount
    prisma.appointment.count({
      where: { businessId, status: 'COMPLETED', startTime: { gte: todayStart, lt: tomorrowStart } },
    }),
    // newClientsThisWeek
    prisma.client.count({ where: { businessId, createdAt: { gte: weekStart } } }),
    // noShowsThisWeek
    prisma.appointment.count({
      where: { businessId, status: 'NO_SHOW', startTime: { gte: weekStart, lt: weekEnd } },
    }),
    // weekAppointments (for weekBars)
    prisma.appointment.findMany({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        startTime: { gte: weekStart, lt: weekEnd },
      },
      select: { startTime: true },
    }),
    // last 60 days appointments (for rebookedRate)
    prisma.appointment.findMany({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        startTime: { gte: sixtyDaysAgo, lte: now },
      },
      select: { clientId: true },
    }),
    // heatmap appointments (last 8 weeks, non-cancelled)
    prisma.appointment.findMany({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        startTime: { gte: eightWeeksAgo, lte: now },
      },
      select: { startTime: true },
    }),
    // topServices this month
    prisma.appointment.groupBy({
      by: ['serviceType'],
      where: { businessId, startTime: { gte: monthStart }, status: { not: 'CANCELLED' } },
      _count: { id: true },
    }),
    // dueBack: clients whose last visit was 28+ days ago with no future appointment
    prisma.client.findMany({
      where: {
        businessId,
        isActive: true,
        appointments: {
          some: { status: 'COMPLETED', startTime: { lte: twentyEightDaysAgo } },
          none: { startTime: { gte: now } },
        },
      },
      select: { id: true },
    }),
  ]);

  // --- existing fields ---
  const totalRevenue = currentRevenue._sum.amount ?? 0;
  const previousTotal = previousRevenue._sum.amount ?? 0;
  const revenueGrowth =
    previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : 0;

  // --- new fields ---

  // collectedToday + avgPerVisit
  const collectedToday = collectedTodayAgg._sum.amount ?? 0;
  const avgPerVisit = todayCompletedCount > 0
    ? Math.round((collectedToday / todayCompletedCount) * 100) / 100
    : 0;

  // rebookedRate
  const clientVisitCounts = new Map<string, number>();
  for (const appt of last60DaysAppointments) {
    if (!appt.clientId) continue;
    clientVisitCounts.set(appt.clientId, (clientVisitCounts.get(appt.clientId) ?? 0) + 1);
  }
  const totalUniqueSeen = clientVisitCounts.size;
  const rebookedCount = [...clientVisitCounts.values()].filter((c) => c >= 2).length;
  const rebookedRate = totalUniqueSeen > 0
    ? Math.round((rebookedCount / totalUniqueSeen) * 100)
    : 0;

  // weekBars
  const weekBarCounts = new Array(7).fill(0);
  for (const appt of weekAppointments) {
    const dow = (new Date(String(appt.startTime)).getDay() + 6) % 7; // 0=Mon..6=Sun
    weekBarCounts[dow]++;
  }
  const todayDow = (now.getDay() + 6) % 7;
  const weekBars = DAY_NAMES.map((day, i) => ({
    day,
    count: weekBarCounts[i],
    isToday: i === todayDow,
  }));

  // busiestHeatmap — 4 slots × 7 days
  const heatGrid: number[][] = Array.from({ length: 4 }, () => new Array(7).fill(0));
  for (const appt of heatmapAppointments) {
    const d = new Date(String(appt.startTime));
    const dow = (d.getDay() + 6) % 7;
    const slotIdx = SLOT_NAMES.indexOf(getSlot(d.getHours()));
    if (slotIdx >= 0) heatGrid[slotIdx][dow]++;
  }
  const maxDensity = Math.max(1, ...heatGrid.flat());
  const busiestHeatmap = SLOT_NAMES.flatMap((slot, si) =>
    Array.from({ length: 7 }, (_, di) => ({
      slot,
      day: di,
      density: Math.round((heatGrid[si][di] / maxDensity) * 100) / 100,
    }))
  );

  // topServices this month
  const monthServiceTotal = topServicesThisMonth.reduce((s, r) => s + r._count.id, 0) || 1;
  const topServices = topServicesThisMonth
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 5)
    .map((s) => ({
      name: s.serviceType ?? 'Other',
      pct: Math.round((s._count.id / monthServiceTotal) * 100),
    }));

  // capacity
  const capacityBooked = todayAppointments.filter(
    (a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW'
  ).length;
  const capacityTotal = 8;

  // dueBack count
  const dueBack = dueBackClients.length;

  return res.ok({
    todayAppointments,
    clientCount,
    revenue: { totalRevenue, revenueGrowth },
    serviceMix: serviceMixRaw
      .map((s) => ({ serviceType: s.serviceType ?? 'Unknown', count: s._count.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    smsCredits,
    // bento fields
    collectedToday,
    avgPerVisit,
    newClientsThisWeek,
    rebookedRate,
    noShowsThisWeek,
    dueBack,
    weekBars,
    busiestHeatmap,
    topServices,
    capacityBooked,
    capacityTotal,
  });
});
