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

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime() - 1);

    const [
      currentRevenue,
      previousRevenue,
      outstandingInvoices,
      totalActiveClients,
      newClients,
      previousNewClients,
      appointmentsByStatus,
      previousAppointments,
      therapistCount,
      totalSessions,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { businessId, paidAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { businessId, paidAt: { gte: previousStartDate, lte: previousEndDate }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { businessId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { amountDue: true },
      }),
      prisma.client.count({ where: { businessId } }),
      prisma.client.count({ where: { businessId, createdAt: { gte: startDate, lte: endDate } } }),
      prisma.client.count({ where: { businessId, createdAt: { gte: previousStartDate, lte: previousEndDate } } }),
      prisma.appointment.groupBy({
        by: ['status'],
        where: { businessId, startTime: { gte: startDate, lte: endDate } },
        _count: true,
      }),
      prisma.appointment.count({ where: { businessId, startTime: { gte: previousStartDate, lte: previousEndDate } } }),
      prisma.therapist.count({ where: { businessId } }),
      prisma.appointment.count({ where: { businessId, startTime: { gte: startDate, lte: endDate }, status: 'COMPLETED' } }),
    ]);

    const totalRevenue = currentRevenue._sum.amount || 0;
    const previousTotalRevenue = previousRevenue._sum.amount || 0;
    const revenueGrowth = previousTotalRevenue > 0
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
      : 0;

    const totalAppointments = appointmentsByStatus.reduce((sum, a) => sum + a._count, 0);
    const completedAppts = appointmentsByStatus.find(a => a.status === 'COMPLETED')?._count || 0;
    const cancelledAppts = appointmentsByStatus.find(a => a.status === 'CANCELLED')?._count || 0;
    const noShowAppts = appointmentsByStatus.find(a => a.status === 'NO_SHOW')?._count || 0;

    const newClientsGrowth = previousNewClients > 0
      ? ((newClients - previousNewClients) / previousNewClients) * 100
      : 0;
    const appointmentsGrowth = previousAppointments > 0
      ? ((totalAppointments - previousAppointments) / previousAppointments) * 100
      : 0;

    return res.ok({
      revenue: {
        totalRevenue,
        averageTransactionValue: currentRevenue._avg.amount || 0,
        revenueGrowth,
        outstandingAmount: outstandingInvoices._sum.amountDue || 0,
        transactionCount: currentRevenue._count,
        previousPeriodRevenue: previousTotalRevenue,
      },
      clients: {
        totalActiveClients,
        newClients,
        newClientsGrowth,
        previousPeriodNewClients: previousNewClients,
      },
      appointments: {
        totalAppointments,
        completionRate: totalAppointments > 0 ? (completedAppts / totalAppointments) * 100 : 0,
        cancellationRate: totalAppointments > 0 ? (cancelledAppts / totalAppointments) * 100 : 0,
        noShowRate: totalAppointments > 0 ? (noShowAppts / totalAppointments) * 100 : 0,
        appointmentsGrowth,
        previousPeriodAppointments: previousAppointments,
      },
      therapists: {
        activeTherapists: therapistCount,
        averageSessionsPerTherapist: therapistCount > 0 ? Math.round((totalSessions / therapistCount) * 10) / 10 : 0,
      },
      generatedAt: new Date(),
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
