import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = { businessId };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const payments = await prisma.payment.findMany({
    where,
    select: { amount: true, refundedAmount: true, status: true, paymentMethod: true, createdAt: true },
  });

  const completed = payments.filter((p) => p.status === 'COMPLETED');
  const totalRevenue = completed.reduce((sum, p) => sum + p.amount - ((p as any).refundedAmount || 0), 0);
  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments.reduce((sum, p) => sum + ((p as any).refundedAmount || 0), 0);

  const byMethod: Record<string, { count: number; total: number }> = {};
  const byStatus: Record<string, { count: number; total: number }> = {};

  for (const p of payments) {
    const method = p.paymentMethod as string;
    byMethod[method] = byMethod[method] || { count: 0, total: 0 };
    byMethod[method].count++;
    byMethod[method].total += p.amount;

    byStatus[p.status] = byStatus[p.status] || { count: 0, total: 0 };
    byStatus[p.status].count++;
    byStatus[p.status].total += p.amount;
  }

  return res.ok({
    totalRevenue,
    totalPending,
    totalRefunded,
    totalPayments: payments.length,
    averagePayment: completed.length > 0 ? totalRevenue / completed.length : 0,
    byMethod,
    byStatus,
  });
});
