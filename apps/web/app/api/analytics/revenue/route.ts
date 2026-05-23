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

    const [currentRevenue, previousRevenue, outstandingInvoices] = await Promise.all([
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
    ]);

    const totalRevenue = currentRevenue._sum.amount || 0;
    const previousTotalRevenue = previousRevenue._sum.amount || 0;
    const revenueGrowth = previousTotalRevenue > 0
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
      : 0;

    return res.ok({
      totalRevenue,
      averageTransactionValue: currentRevenue._avg.amount || 0,
      revenueGrowth,
      outstandingAmount: outstandingInvoices._sum.amountDue || 0,
      transactionCount: currentRevenue._count,
      previousPeriodRevenue: previousTotalRevenue,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
