import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { emitWebhookEvent } from '@/lib/webhooks';
import { emitAutomation } from '@/lib/automation';

function calculateTotals(lineItems: any[], taxAmount = 0, discountAmount = 0) {
  const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0);
  const total = subtotal + taxAmount - discountAmount;
  return { subtotal, total };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const invoice = await prisma.invoice.findFirst({
      where: { id, businessId },
      include: { client: true, payments: true },
    });

    if (!invoice) return res.notFound('Invoice not found');

    return res.ok(invoice);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, ...data } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const invoice = await prisma.invoice.findFirst({ where: { id, businessId } });
    if (!invoice) return res.notFound('Invoice not found');

    let totals: any = {};
    if (data.lineItems || data.taxAmount !== undefined || data.discountAmount !== undefined) {
      const lineItems = data.lineItems || (invoice.lineItems as any[]);
      const taxAmount = data.taxAmount !== undefined ? data.taxAmount : invoice.taxAmount;
      const discountAmount = data.discountAmount !== undefined ? data.discountAmount : invoice.discountAmount;
      const calculated = calculateTotals(lineItems, taxAmount, discountAmount);
      totals = {
        subtotal: calculated.subtotal,
        total: calculated.total,
        amountDue: calculated.total - invoice.amountPaid,
      };
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        ...totals,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: { client: true, payments: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'INVOICE_UPDATED',
        entityType: 'Invoice',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    if (updatedInvoice.status === 'PAID' && invoice.status !== 'PAID') {
      emitWebhookEvent(businessId, 'invoice.paid', { id, invoiceNumber: updatedInvoice.invoiceNumber, total: updatedInvoice.total, clientId: updatedInvoice.clientId }).catch(() => {});
      emitAutomation('PAYMENT_RECEIVED', businessId, {
        invoiceId: id,
        clientId: updatedInvoice.clientId,
        amount: updatedInvoice.total,
        invoiceNumber: updatedInvoice.invoiceNumber,
        businessId,
      });
    }

    return res.ok(updatedInvoice);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const invoice = await prisma.invoice.findFirst({ where: { id, businessId } });
    if (!invoice) return res.notFound('Invoice not found');

    if (invoice.status === 'PAID') {
      return res.badRequest('Cannot delete a paid invoice');
    }

    await prisma.invoice.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'INVOICE_DELETED',
        entityType: 'Invoice',
        entityId: id,
        metadata: { invoiceNumber: invoice.invoiceNumber },
      },
    });

    return res.ok({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
