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

    if (!startDateParam || !endDateParam) {
      return res.badRequest('startDate and endDate are required');
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const [revenueResult, paymentMethodData] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true, refundedAmount: true, stripeFee: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          businessId,
          status: 'COMPLETED',
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const grossRevenue = revenueResult._sum.amount || 0;
    const refunds = revenueResult._sum.refundedAmount || 0;
    const stripeFees = (revenueResult._sum as any).stripeFee || 0;
    const netRevenue = grossRevenue - refunds - stripeFees;

    const paymentMethodBreakdown = paymentMethodData.map(pm => ({
      method: pm.paymentMethod,
      amount: pm._sum.amount || 0,
      percentage: grossRevenue > 0
        ? Math.round(((pm._sum.amount || 0) / grossRevenue) * 10000) / 100
        : 0,
    }));

    return res.ok({
      grossRevenue,
      netRevenue,
      taxesCollected: 0,
      paymentMethodBreakdown,
      refunds,
      chargebacks: 0,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
