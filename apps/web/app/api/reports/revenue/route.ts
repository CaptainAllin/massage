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

    if (!startDateParam || !endDateParam) {
      return res.badRequest('startDate and endDate are required');
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const totalRevenueResult = await prisma.payment.aggregate({
      where: {
        businessId,
        status: 'COMPLETED',
        paidAt: { gte: startDate, lte: endDate },
        ...(therapistId && { appointment: { therapistId } }),
      },
      _sum: { amount: true, refundedAmount: true },
    });

    const totalRevenue = totalRevenueResult._sum.amount || 0;
    const refundsTotal = totalRevenueResult._sum.refundedAmount || 0;

    // Revenue by appointment grouped by therapist
    const revenueByAppt = await prisma.payment.groupBy({
      by: ['appointmentId'],
      where: {
        businessId,
        status: 'COMPLETED',
        paidAt: { gte: startDate, lte: endDate },
        ...(therapistId && { appointment: { therapistId } }),
      },
      _sum: { amount: true },
    });

    const appointmentIds = revenueByAppt
      .map(r => r.appointmentId)
      .filter((id): id is string => id !== null);

    const appointments = await prisma.appointment.findMany({
      where: { id: { in: appointmentIds } },
      include: { therapist: { include: { user: true } } },
    });

    // Aggregate by therapist
    const therapistRevenueMap = new Map<string, { name: string; revenue: number; count: number }>();
    appointments.forEach(apt => {
      const revenue = revenueByAppt.find(r => r.appointmentId === apt.id)?._sum.amount || 0;
      const existing = therapistRevenueMap.get(apt.therapistId);
      const therapistName = `${apt.therapist.user.firstName || ''} ${apt.therapist.user.lastName || ''}`.trim();
      if (existing) {
        existing.revenue += revenue;
        existing.count += 1;
      } else {
        therapistRevenueMap.set(apt.therapistId, { name: therapistName, revenue, count: 1 });
      }
    });

    const byTherapist = Array.from(therapistRevenueMap.entries()).map(([tid, data]) => ({
      therapistId: tid,
      therapistName: data.name,
      revenue: data.revenue,
      appointmentCount: data.count,
    }));

    // Aggregate by service type
    const serviceTypeMap = new Map<string, { revenue: number; count: number }>();
    appointments.forEach(apt => {
      if (apt.serviceType) {
        const revenue = revenueByAppt.find(r => r.appointmentId === apt.id)?._sum.amount || 0;
        const existing = serviceTypeMap.get(apt.serviceType);
        if (existing) { existing.revenue += revenue; existing.count += 1; }
        else serviceTypeMap.set(apt.serviceType, { revenue, count: 1 });
      }
    });

    const byServiceType = Array.from(serviceTypeMap.entries()).map(([serviceType, data]) => ({
      serviceType,
      revenue: data.revenue,
      count: data.count,
    }));

    const byPaymentMethod = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { businessId, status: 'COMPLETED', paidAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      _count: true,
    });

    // Monthly revenue trend for current period
    const allPaymentsInPeriod = await prisma.payment.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        paidAt: { gte: startDate, lte: endDate },
      },
      select: { paidAt: true, amount: true },
    });

    const monthlyMap = new Map<string, number>();
    allPaymentsInPeriod.forEach(p => {
      if (p.paidAt) {
        const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + p.amount);
      }
    });

    // Prev year same period for YoY
    const prevStart = new Date(startDate);
    prevStart.setFullYear(prevStart.getFullYear() - 1);
    const prevEnd = new Date(endDate);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1);

    const prevYearPayments = await prisma.payment.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        paidAt: { gte: prevStart, lte: prevEnd },
      },
      select: { paidAt: true, amount: true },
    });

    const prevMonthlyMap = new Map<string, number>();
    prevYearPayments.forEach(p => {
      if (p.paidAt) {
        const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
        prevMonthlyMap.set(key, (prevMonthlyMap.get(key) || 0) + p.amount);
      }
    });

    const monthlyRevenue = Array.from(monthlyMap.entries())
      .map(([month, revenue]) => {
        const prevKey = `${parseInt(month.split('-')[0]) - 1}-${month.split('-')[1]}`;
        return { month, revenue, prevYearRevenue: prevMonthlyMap.get(prevKey) || 0 };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Average invoice value
    const invoiceAvg = await prisma.invoice.aggregate({
      where: {
        businessId,
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
        paidAt: { gte: startDate, lte: endDate },
      },
      _avg: { total: true },
    });

    return res.ok({
      totalRevenue,
      byTherapist,
      byServiceType,
      byPaymentMethod: byPaymentMethod.map(pm => ({
        paymentMethod: pm.paymentMethod,
        amount: pm._sum.amount || 0,
        count: pm._count,
      })),
      monthlyRevenue,
      averageInvoiceValue: invoiceAvg._avg.total || 0,
      tipsTotal: 0,
      refundsTotal,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
