import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const businessId = searchParams.get('businessId') || body.businessId;

    if (!businessId) return res.badRequest('businessId is required');

    const invoice = await prisma.invoice.findFirst({ where: { id, businessId } });
    if (!invoice) return res.notFound('Invoice not found');

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        issuedAt: invoice.issuedAt || new Date(),
      },
      include: { client: true, payments: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'INVOICE_SENT',
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
