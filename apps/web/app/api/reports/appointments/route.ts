import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const therapistId = searchParams.get('therapistId') || undefined;
    const serviceType = searchParams.get('serviceType') || undefined;

    if (!startDateParam || !endDateParam) {
      return res.badRequest('startDate and endDate are required');
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const baseWhere: any = {
      businessId,
      startTime: { gte: startDate, lte: endDate },
      ...(therapistId && { therapistId }),
      ...(serviceType && { serviceType }),
    };

    const [totalAppointments, byStatusData, byServiceTypeData, appointments, avgDurationResult, avgDurationByServiceData] =
      await Promise.all([
        prisma.appointment.count({ where: baseWhere }),
        prisma.appointment.groupBy({
          by: ['status'],
          where: baseWhere,
          _count: true,
        }),
        prisma.appointment.groupBy({
          by: ['serviceType'],
          where: { ...baseWhere, serviceType: { not: null } },
          _count: true,
        }),
        prisma.appointment.findMany({
          where: baseWhere,
          select: {
            startTime: true,
            status: true,
            therapistId: true,
            therapist: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        }),
        prisma.appointment.aggregate({
          where: baseWhere,
          _avg: { duration: true },
        }),
        prisma.appointment.groupBy({
          by: ['serviceType'],
          where: { ...baseWhere, serviceType: { not: null }, duration: { gt: 0 } },
          _avg: { duration: true },
          _count: true,
        }),
      ]);

    const byStatus = byStatusData.map(item => ({
      status: item.status,
      count: item._count,
      percentage: totalAppointments > 0
        ? Math.round((item._count / totalAppointments) * 10000) / 100
        : 0,
    }));

    const byServiceType = byServiceTypeData.map(item => ({
      serviceType: item.serviceType || 'Unknown',
      count: item._count,
    }));

    const avgDurationByServiceType = avgDurationByServiceData.map(item => ({
      serviceType: item.serviceType || 'Unknown',
      avgDuration: Math.round(item._avg.duration || 0),
      count: item._count,
    }));

    // Peak times — all slots for heatmap
    const peakTimesMap = new Map<string, number>();
    appointments.forEach(apt => {
      const hour = apt.startTime.getHours();
      const dayOfWeek = apt.startTime.getDay();
      const key = `${dayOfWeek}-${hour}`;
      peakTimesMap.set(key, (peakTimesMap.get(key) || 0) + 1);
    });

    const peakTimes = Array.from(peakTimesMap.entries()).map(([key, count]) => {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      return { hour, dayOfWeek, count };
    });

    // No-show and cancellation rate per therapist
    const therapistStatsMap = new Map<string, {
      name: string;
      total: number;
      noShows: number;
      cancellations: number;
      completed: number;
    }>();

    appointments.forEach(apt => {
      const name =
        `${apt.therapist?.user?.firstName || ''} ${apt.therapist?.user?.lastName || ''}`.trim() || 'Unknown';
      const existing = therapistStatsMap.get(apt.therapistId);
      if (existing) {
        existing.total++;
        if (apt.status === 'NO_SHOW') existing.noShows++;
        if (apt.status === 'CANCELLED') existing.cancellations++;
        if (apt.status === 'COMPLETED') existing.completed++;
      } else {
        therapistStatsMap.set(apt.therapistId, {
          name,
          total: 1,
          noShows: apt.status === 'NO_SHOW' ? 1 : 0,
          cancellations: apt.status === 'CANCELLED' ? 1 : 0,
          completed: apt.status === 'COMPLETED' ? 1 : 0,
        });
      }
    });

    const noShowByTherapist = Array.from(therapistStatsMap.entries()).map(([therapistId, data]) => ({
      therapistId,
      therapistName: data.name,
      total: data.total,
      noShows: data.noShows,
      cancellations: data.cancellations,
      completed: data.completed,
      noShowRate: data.total > 0 ? Math.round((data.noShows / data.total) * 10000) / 100 : 0,
      cancellationRate: data.total > 0 ? Math.round((data.cancellations / data.total) * 10000) / 100 : 0,
    }));

    return res.ok({
      totalAppointments,
      byStatus,
      byServiceType,
      peakTimes,
      noShowByTherapist,
      avgDurationByServiceType,
      averageDuration: avgDurationResult._avg.duration || 0,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
