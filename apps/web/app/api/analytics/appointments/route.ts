import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime() - 1);

    const [appointmentsByStatus, previousAppointments, therapistCount] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['status'],
        where: { businessId, startTime: { gte: startDate, lte: endDate } },
        _count: true,
      }),
      prisma.appointment.count({
        where: { businessId, startTime: { gte: previousStartDate, lte: previousEndDate } },
      }),
      prisma.therapist.count(),
    ]);

    const totalAppointments = appointmentsByStatus.reduce((sum, a) => sum + a._count, 0);
    const completed = appointmentsByStatus.find(a => a.status === 'COMPLETED')?._count || 0;
    const cancelled = appointmentsByStatus.find(a => a.status === 'CANCELLED')?._count || 0;
    const noShow = appointmentsByStatus.find(a => a.status === 'NO_SHOW')?._count || 0;

    const workingDays = Math.ceil(periodDuration / (1000 * 60 * 60 * 24));
    const averageSlotsPerDay = 8;
    const potentialSlots = therapistCount * workingDays * averageSlotsPerDay;
    const averageUtilization = potentialSlots > 0 ? (totalAppointments / potentialSlots) * 100 : 0;

    const appointmentsGrowth = previousAppointments > 0
      ? ((totalAppointments - previousAppointments) / previousAppointments) * 100
      : 0;

    return res.ok({
      totalAppointments,
      completionRate: totalAppointments > 0 ? (completed / totalAppointments) * 100 : 0,
      cancellationRate: totalAppointments > 0 ? (cancelled / totalAppointments) * 100 : 0,
      noShowRate: totalAppointments > 0 ? (noShow / totalAppointments) * 100 : 0,
      averageUtilization: Math.min(averageUtilization, 100),
      appointmentsGrowth,
      previousPeriodAppointments: previousAppointments,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
