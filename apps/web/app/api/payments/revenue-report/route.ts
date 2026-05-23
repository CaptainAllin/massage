import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, _user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const type = searchParams.get('type') || 'daily'; // daily | monthly | tax
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!businessId) return res.badRequest('businessId is required');

  const dateFilter: any = { businessId, status: 'COMPLETED' };
  if (startDate || endDate) {
    dateFilter.paidAt = {};
    if (startDate) dateFilter.paidAt.gte = new Date(startDate);
    if (endDate) dateFilter.paidAt.lte = new Date(endDate);
  }

  if (type === 'daily') {
    const payments = await prisma.payment.findMany({
      where: dateFilter,
      select: { paidAt: true, amount: true, refundedAmount: true, paymentMethod: true },
      orderBy: { paidAt: 'asc' },
    });

    const byDay = new Map<string, { date: string; revenue: number; refunds: number; net: number; count: number }>();
    for (const p of payments) {
      const day = (p.paidAt ?? new Date()).toISOString().split('T')[0];
      const cur = byDay.get(day) ?? { date: day, revenue: 0, refunds: 0, net: 0, count: 0 };
      cur.revenue += p.amount;
      cur.refunds += p.refundedAmount ?? 0;
      cur.net = cur.revenue - cur.refunds;
      cur.count += 1;
      byDay.set(day, cur);
    }

    return res.ok({
      type: 'daily',
      rows: Array.from(byDay.values()),
      totals: {
        revenue: payments.reduce((s, p) => s + p.amount, 0),
        refunds: payments.reduce((s, p) => s + (p.refundedAmount ?? 0), 0),
        count: payments.length,
      },
    });
  }

  if (type === 'monthly') {
    const payments = await prisma.payment.findMany({
      where: dateFilter,
      select: { paidAt: true, amount: true, refundedAmount: true },
      orderBy: { paidAt: 'asc' },
    });

    const byMonth = new Map<string, { month: string; revenue: number; refunds: number; net: number; count: number }>();
    for (const p of payments) {
      const d = p.paidAt ?? new Date();
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonth.get(month) ?? { month, revenue: 0, refunds: 0, net: 0, count: 0 };
      cur.revenue += p.amount;
      cur.refunds += p.refundedAmount ?? 0;
      cur.net = cur.revenue - cur.refunds;
      cur.count += 1;
      byMonth.set(month, cur);
    }

    return res.ok({
      type: 'monthly',
      rows: Array.from(byMonth.values()),
      totals: {
        revenue: payments.reduce((s, p) => s + p.amount, 0),
        refunds: payments.reduce((s, p) => s + (p.refundedAmount ?? 0), 0),
        count: payments.length,
      },
    });
  }

  if (type === 'tax') {
    const invoiceFilter: any = { businessId, status: 'PAID' };
    if (startDate || endDate) {
      invoiceFilter.paidAt = {};
      if (startDate) invoiceFilter.paidAt.gte = new Date(startDate);
      if (endDate) invoiceFilter.paidAt.lte = new Date(endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceFilter,
      select: { total: true, subtotal: true, taxAmount: true, paidAt: true },
    });

    const byMonth = new Map<string, { month: string; subtotal: number; tax: number; total: number; count: number }>();
    for (const inv of invoices) {
      const d = inv.paidAt ?? new Date();
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonth.get(month) ?? { month, subtotal: 0, tax: 0, total: 0, count: 0 };
      cur.subtotal += inv.subtotal;
      cur.tax += inv.taxAmount;
      cur.total += inv.total;
      cur.count += 1;
      byMonth.set(month, cur);
    }

    return res.ok({
      type: 'tax',
      rows: Array.from(byMonth.values()),
      totals: {
        subtotal: invoices.reduce((s, i) => s + i.subtotal, 0),
        tax: invoices.reduce((s, i) => s + i.taxAmount, 0),
        total: invoices.reduce((s, i) => s + i.total, 0),
        invoiceCount: invoices.length,
      },
    });
  }

  return res.badRequest('type must be daily, monthly, or tax');
});
