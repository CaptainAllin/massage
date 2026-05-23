import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

function calculateTotals(lineItems: any[], taxAmount = 0, discountAmount = 0) {
  const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0);
  const total = subtotal + taxAmount - discountAmount;
  return { subtotal, total };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, description, quantity, unitPrice, appointmentId } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!description) return res.badRequest('description is required');
    if (quantity === undefined) return res.badRequest('quantity is required');
    if (unitPrice === undefined) return res.badRequest('unitPrice is required');

    const invoice = await prisma.invoice.findFirst({ where: { id, businessId } });
    if (!invoice) return res.notFound('Invoice not found');

    const lineItem = {
      description,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      appointmentId,
    };

    const lineItems = [...(invoice.lineItems as any[]), lineItem];
    const { subtotal, total } = calculateTotals(lineItems, invoice.taxAmount, invoice.discountAmount);

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        lineItems,
        subtotal,
        total,
        amountDue: total - invoice.amountPaid,
      },
      include: { client: true, payments: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'INVOICE_LINE_ITEM_ADDED',
        entityType: 'Invoice',
        entityId: id,
      },
    });

    return res.ok(updatedInvoice);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
