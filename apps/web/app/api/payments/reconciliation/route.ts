import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, _user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const now = new Date();

  const [unmatchedPayments, overdueInvoices, partialPayments] = await Promise.all([
    prisma.payment.findMany({
      where: { businessId, status: 'COMPLETED', invoiceId: null },
      include: { client: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { paidAt: 'desc' },
      take: 100,
    }),
    prisma.invoice.findMany({
      where: {
        businessId,
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        payments: { select: { id: true, amount: true, status: true, paidAt: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 100,
    }),
    prisma.invoice.findMany({
      where: {
        businessId,
        status: 'PARTIALLY_PAID',
        amountDue: { gt: 0 },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        payments: { select: { id: true, amount: true, status: true, paidAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const totalUnmatched = unmatchedPayments.reduce((s, p) => s + p.amount, 0);
  const totalOverdue = overdueInvoices.reduce((s, i) => s + i.amountDue, 0);
  const totalPartial = partialPayments.reduce((s, i) => s + i.amountDue, 0);

  return res.ok({
    summary: {
      unmatchedPaymentsCount: unmatchedPayments.length,
      unmatchedPaymentsAmount: totalUnmatched,
      overdueInvoicesCount: overdueInvoices.length,
      overdueAmount: totalOverdue,
      partialPaymentsCount: partialPayments.length,
      partialAmount: totalPartial,
    },
    unmatchedPayments,
    overdueInvoices,
    partialPayments,
  });
});
