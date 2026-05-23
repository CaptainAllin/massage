import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

async function generateInvoiceNumber(businessId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const count = await prisma.invoice.count({
    where: { businessId, invoiceNumber: { startsWith: prefix } },
  });
  const nextNumber = (count + 1).toString().padStart(4, '0');
  return `${prefix}${nextNumber}`;
}

function calculateTotals(lineItems: any[], taxAmount = 0, discountAmount = 0) {
  const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0);
  const total = subtotal + taxAmount - discountAmount;
  return { subtotal, total, amountDue: total };
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const overdue = searchParams.get('overdue') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = { businessId };
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['SENT', 'PARTIALLY_PAID'] };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { client: true, payments: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: invoices,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, clientId, lineItems, taxAmount, discountAmount, notes, dueDate } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!clientId) return res.badRequest('clientId is required');
    if (!lineItems) return res.badRequest('lineItems is required');

    const invoiceNumber = await generateInvoiceNumber(businessId);
    const { subtotal, total, amountDue } = calculateTotals(lineItems, taxAmount, discountAmount);

    const invoice = await prisma.invoice.create({
      data: {
        businessId,
        clientId,
        invoiceNumber,
        lineItems,
        subtotal,
        taxAmount: taxAmount || 0,
        discountAmount: discountAmount || 0,
        total,
        amountPaid: 0,
        amountDue,
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'DRAFT',
      },
      include: { client: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'INVOICE_CREATED',
        entityType: 'Invoice',
        entityId: invoice.id,
        metadata: { invoiceNumber, total },
      },
    });

    return res.created(invoice);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
