import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { emitAutomation } from '@/lib/automation';

async function updateInvoicePaymentStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return;
  const totalPaid = invoice.payments.filter((p) => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = invoice.payments.reduce((sum, p) => sum + ((p as any).refundedAmount || 0), 0);
  const amountPaid = totalPaid - totalRefunded;
  const amountDue = invoice.total - amountPaid;
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid, amountDue, status: amountDue <= 0 ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : invoice.status, paidAt: amountDue <= 0 ? new Date() : null } as any,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, amount, reason } = body;
    if (!businessId) return res.badRequest('businessId is required');

    const payment = await prisma.payment.findFirst({ where: { id: params.id, businessId } });
    if (!payment) return res.notFound('Payment not found');
    if (payment.status !== 'COMPLETED') return res.badRequest('Only completed payments can be refunded');

    const refundAmount = amount || payment.amount;
    const alreadyRefunded = (payment as any).refundedAmount || 0;
    if (refundAmount > payment.amount - alreadyRefunded) return res.badRequest('Refund amount exceeds remaining');

    if (payment.paymentMethod === 'STRIPE_CARD' && (payment as any).stripeChargeId && process.env.ENABLE_STRIPE === 'true') {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        await stripe.refunds.create({ charge: (payment as any).stripeChargeId, amount: Math.round(refundAmount * 100) });
      } catch (err: any) {
        return res.badRequest(err.message || 'Stripe refund failed');
      }
    }

    const totalRefunded = alreadyRefunded + refundAmount;
    const updated = await prisma.payment.update({
      where: { id: params.id },
      data: { status: totalRefunded >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED', refundedAmount: totalRefunded, refundReason: reason, refundedAt: new Date() } as any,
      include: { client: true, invoice: true },
    });

    if (payment.invoiceId) await updateInvoicePaymentStatus(payment.invoiceId);
    await logAudit(req, { userId: user.id, businessId, action: 'PAYMENT_REFUNDED', entityType: 'Payment', entityId: params.id, metadata: { refundAmount, reason } });

    emitAutomation('REFUND_ISSUED', businessId, {
      paymentId: params.id, clientId: updated.client?.id ?? null, businessId,
      refundAmount, reason: reason ?? null, invoiceId: payment.invoiceId ?? null,
    });

    return res.ok(updated, 'Payment refunded');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
