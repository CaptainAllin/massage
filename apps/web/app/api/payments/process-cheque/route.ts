import { withAuth, requirePermission, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { awardPaymentPoints } from '@/lib/loyalty';

async function updateInvoicePaymentStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return;
  const totalPaid = invoice.payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const status = totalPaid >= invoice.total ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'SENT';
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
}

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { paymentId, businessId, chequeNumber, notes } = body;
  if (!paymentId || !businessId) return res.badRequest('paymentId and businessId are required');
  await requirePermission(user, businessId, 'payments:process');

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, businessId } });
  if (!payment) return res.notFound('Payment not found');
  if (payment.status !== 'PENDING') return res.badRequest('Payment has already been processed');

  const chequeNote = chequeNumber ? `Cheque #${chequeNumber}` : 'Cheque payment';
  const combinedNotes = [payment.notes, chequeNote, notes].filter(Boolean).join('\n');

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'COMPLETED', paidAt: new Date(), notes: combinedNotes },
    include: { client: true, invoice: true },
  });

  if (payment.invoiceId) await updateInvoicePaymentStatus(payment.invoiceId);

  awardPaymentPoints({ businessId, clientId: payment.clientId, amount: payment.amount, paymentId }).catch(() => {});

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      businessId,
      action: 'PAYMENT_COMPLETED_CHEQUE',
      entityType: 'Payment',
      entityId: paymentId,
    },
  });

  return res.ok(updated, 'Cheque payment completed');
});
