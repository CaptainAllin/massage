import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendInvoiceOverdueReminder } from '@/lib/email';
import { sendPaymentOverdueSms } from '@/lib/sms';
import { res } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return res.unauthorized('Invalid cron secret');
  }

  const now = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['SENT', 'PARTIALLY_PAID'] },
      dueDate: { lt: now },
    },
    include: {
      client: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
      business: { select: { name: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const invoice of overdueInvoices) {
    const hasContact = invoice.client.email || invoice.client.phoneNumber;
    if (!hasContact) { skipped++; continue; }

    try {
      if (invoice.client.email) {
        await sendInvoiceOverdueReminder({
          to: invoice.client.email,
          businessName: invoice.business.name,
          client: { firstName: invoice.client.firstName, lastName: invoice.client.lastName },
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            amountDue: invoice.amountDue,
            dueDate: invoice.dueDate!,
          },
        });
      }

      if (invoice.client.phoneNumber) {
        await sendPaymentOverdueSms({
          to: invoice.client.phoneNumber,
          channel: 'SMS',
          businessName: invoice.business.name,
          client: { firstName: invoice.client.firstName },
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            amountDue: invoice.amountDue,
            dueDate: invoice.dueDate!,
          },
        });
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      });

      sent++;
    } catch (err) {
      console.error('[InvoiceReminder]', err);
    }
  }

  return res.ok({ processed: overdueInvoices.length, sent, skipped });
}
