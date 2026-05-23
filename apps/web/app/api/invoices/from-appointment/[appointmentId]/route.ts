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

export async function POST(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const user = await requireAuth(req);
    const { appointmentId } = params;
    const body = await req.json();
    const { businessId } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
      include: { client: true, therapist: true },
    });

    if (!appointment) return res.notFound('Appointment not found');

    const lineItems = [
      {
        description: `${(appointment as any).serviceType || 'Massage Session'} - Therapist`,
        quantity: 1,
        unitPrice: (appointment as any).price || 0,
        total: (appointment as any).price || 0,
        appointmentId: appointment.id,
      },
    ];

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal;
    const invoiceNumber = await generateInvoiceNumber(businessId);

    const invoice = await prisma.invoice.create({
      data: {
        businessId,
        clientId: appointment.clientId,
        invoiceNumber,
        lineItems,
        subtotal,
        taxAmount: 0,
        discountAmount: 0,
        total,
        amountPaid: 0,
        amountDue: total,
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
        metadata: { invoiceNumber, total, appointmentId },
      },
    });

    return res.created(invoice);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
