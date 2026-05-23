import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendInvoiceSms, type SmsChannel } from '@/lib/sms';

export const POST = withAuth(async (req, _user, ctx) => {
  const id = ctx?.params?.id;
  if (!id) return res.badRequest('id is required');

  const body = await req.json();
  const { businessId, channel = 'SMS' } = body as { businessId: string; channel: SmsChannel };
  if (!businessId) return res.badRequest('businessId is required');

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId },
    include: {
      client: { select: { firstName: true, lastName: true, phoneNumber: true } },
      business: { select: { name: true } },
    },
  });

  if (!invoice) return res.notFound('Invoice not found');
  if (!invoice.client.phoneNumber) return res.badRequest('Client does not have a phone number');

  await sendInvoiceSms({
    to: invoice.client.phoneNumber,
    channel,
    businessName: invoice.business.name,
    client: { firstName: invoice.client.firstName, lastName: invoice.client.lastName },
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      amountDue: invoice.amountDue,
      dueDate: invoice.dueDate,
    },
  });

  await prisma.invoice.update({
    where: { id },
    data: {
      sentAt: invoice.sentAt ?? new Date(),
      status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
      issuedAt: invoice.issuedAt ?? new Date(),
    },
  });

  return res.ok({ sent: true, channel });
});
