import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

function calculateTotals(lineItems: any[], taxAmount = 0, discountAmount = 0) {
  const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0);
  const total = subtotal + taxAmount - discountAmount;
  return { subtotal, total };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const index = parseInt(params.index, 10);
    const body = await req.json();
    const { businessId, ...data } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const invoice = await prisma.invoice.findFirst({ where: { id, businessId } });
    if (!invoice) return res.notFound('Invoice not found');

    const lineItems = [...(invoice.lineItems as any[])];
    if (index < 0 || index >= lineItems.length) {
      return res.notFound('Line item not found');
    }

    const lineItem = lineItems[index];
    const updatedLineItem = {
      ...lineItem,
      description: data.description !== undefined ? data.description : lineItem.description,
      quantity: data.quantity !== undefined ? data.quantity : lineItem.quantity,
      unitPrice: data.unitPrice !== undefined ? data.unitPrice : lineItem.unitPrice,
      appointmentId: data.appointmentId !== undefined ? data.appointmentId : lineItem.appointmentId,
    };
    updatedLineItem.total = updatedLineItem.quantity * updatedLineItem.unitPrice;
    lineItems[index] = updatedLineItem;

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
        action: 'INVOICE_LINE_ITEM_UPDATED',
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const index = parseInt(params.index, 10);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const invoice = await prisma.invoice.findFirst({ where: { id, businessId } });
    if (!invoice) return res.notFound('Invoice not found');

    const lineItems = [...(invoice.lineItems as any[])];
    if (index < 0 || index >= lineItems.length) {
      return res.notFound('Line item not found');
    }

    lineItems.splice(index, 1);

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
        action: 'INVOICE_LINE_ITEM_REMOVED',
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
