import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const now = new Date();

    const [outstandingInvoices, paidInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          businessId,
          status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
        },
        select: {
          id: true,
          amountDue: true,
          total: true,
          dueDate: true,
          status: true,
          client: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.invoice.findMany({
        where: { businessId, status: { in: ['PAID', 'PARTIALLY_PAID'] } },
        select: { total: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      }),
    ]);

    // Build ageing buckets
    const ageing = {
      current: { count: 0, amount: 0 },
      days30: { count: 0, amount: 0 },
      days60: { count: 0, amount: 0 },
      days90: { count: 0, amount: 0 },
      over90: { count: 0, amount: 0 },
    };

    const outstandingByClient: Array<{
      clientName: string;
      amount: number;
      daysPastDue: number;
      status: string;
    }> = [];

    outstandingInvoices.forEach(inv => {
      const daysPastDue = inv.dueDate
        ? Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let bucket: keyof typeof ageing;
      if (daysPastDue <= 0) bucket = 'current';
      else if (daysPastDue <= 30) bucket = 'days30';
      else if (daysPastDue <= 60) bucket = 'days60';
      else if (daysPastDue <= 90) bucket = 'days90';
      else bucket = 'over90';

      ageing[bucket].count++;
      ageing[bucket].amount += inv.amountDue;

      outstandingByClient.push({
        clientName: inv.client
          ? `${inv.client.firstName} ${inv.client.lastName}`.trim()
          : 'Unknown',
        amount: inv.amountDue,
        daysPastDue: Math.max(0, daysPastDue),
        status: inv.status,
      });
    });

    outstandingByClient.sort((a, b) => b.amount - a.amount);

    // Average invoice value trend by month
    const avgByMonthMap = new Map<string, { sum: number; count: number }>();
    paidInvoices.forEach(inv => {
      if (inv.paidAt && inv.total) {
        const key = `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, '0')}`;
        const existing = avgByMonthMap.get(key);
        if (existing) {
          existing.sum += inv.total;
          existing.count++;
        } else {
          avgByMonthMap.set(key, { sum: inv.total, count: 1 });
        }
      }
    });

    const avgInvoiceValueTrend = Array.from(avgByMonthMap.entries())
      .map(([month, { sum, count }]) => ({ month, avgValue: sum / count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const avgInvoiceValue =
      paidInvoices.length > 0
        ? paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / paidInvoices.length
        : 0;

    return res.ok({
      ageing,
      outstandingByClient: outstandingByClient.slice(0, 20),
      totalOutstanding,
      avgInvoiceValue,
      avgInvoiceValueTrend,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
