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

    const [totalAppointments, byStatusData, byServiceTypeData, appointments, avgDurationResult] =
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
          select: { startTime: true },
        }),
        prisma.appointment.aggregate({
          where: baseWhere,
          _avg: { duration: true },
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

    // Peak times
    const peakTimesMap = new Map<string, number>();
    appointments.forEach(apt => {
      const hour = apt.startTime.getHours();
      const dayOfWeek = apt.startTime.getDay();
      const key = `${dayOfWeek}-${hour}`;
      peakTimesMap.set(key, (peakTimesMap.get(key) || 0) + 1);
    });

    const peakTimes = Array.from(peakTimesMap.entries())
      .map(([key, count]) => {
        const [dayOfWeek, hour] = key.split('-').map(Number);
        return { hour, dayOfWeek, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.ok({
      totalAppointments,
      byStatus,
      byServiceType,
      peakTimes,
      averageDuration: avgDurationResult._avg.duration || 0,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
