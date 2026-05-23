import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendInvoiceEmail } from '@/lib/email';

export const POST = withAuth(async (req, _user, ctx) => {
  const id = ctx?.params?.id;
  if (!id) return res.badRequest('id is required');

  const body = await req.json();
  const { businessId } = body;
  if (!businessId) return res.badRequest('businessId is required');

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId },
    include: {
      client: true,
      business: { select: { name: true, email: true, phoneNumber: true } },
    },
  });

  if (!invoice) return res.notFound('Invoice not found');
  if (!invoice.client.email) return res.badRequest('Client does not have an email address');

  await sendInvoiceEmail({
    to: invoice.client.email,
    businessName: invoice.business.name,
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      amountDue: invoice.amountDue,
      dueDate: invoice.dueDate ?? undefined,
      lineItems: invoice.lineItems as any[],
    },
    client: {
      firstName: invoice.client.firstName,
      lastName: invoice.client.lastName,
    },
  });

  await prisma.invoice.update({
    where: { id },
    data: {
      sentAt: new Date(),
      status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
      issuedAt: invoice.issuedAt ?? new Date(),
    },
  });

  return res.ok({ sent: true });
});
