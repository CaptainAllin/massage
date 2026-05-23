import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const invoices = await prisma.invoice.findMany({
      where: { businessId },
      select: {
        total: true,
        amountPaid: true,
        amountDue: true,
        status: true,
        dueDate: true,
      },
    });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    const now = new Date();
    const overdueInvoices = invoices.filter(
      inv =>
        inv.dueDate &&
        inv.dueDate < now &&
        ['SENT', 'PARTIALLY_PAID'].includes(inv.status)
    );
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    const paidCount = invoices.filter(inv => inv.status === 'PAID').length;
    const overdueCount = overdueInvoices.length;

    return res.ok({
      totalInvoiced,
      totalPaid,
      totalOverdue,
      totalOutstanding,
      invoiceCount: invoices.length,
      paidCount,
      overdueCount,
      averageInvoice: invoices.length > 0 ? totalInvoiced / invoices.length : 0,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
