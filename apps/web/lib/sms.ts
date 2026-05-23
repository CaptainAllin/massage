export type SmsChannel = 'SMS' | 'WHATSAPP';

async function sendTwilioMessage(to: string, body: string, channel: SmsChannel = 'SMS') {
  if (process.env.ENABLE_TWILIO !== 'true') return;
  if (!to) return;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER!;

  const from = channel === 'WHATSAPP' ? `whatsapp:${fromNumber}` : fromNumber;
  const recipient = channel === 'WHATSAPP' ? `whatsapp:${to}` : to;

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ Body: body, From: from, To: recipient }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio ${response.status}: ${text}`);
  }
}

export async function sendInvoiceSms(params: {
  to: string;
  channel: SmsChannel;
  businessName: string;
  client: { firstName: string; lastName: string };
  invoice: { invoiceNumber: string; amountDue: number; dueDate?: Date | null };
}) {
  const { to, channel, businessName, client, invoice } = params;
  const dueStr = invoice.dueDate
    ? invoice.dueDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'on receipt';
  const amount = `$${invoice.amountDue.toFixed(2)}`;

  const body = `Hi ${client.firstName}, invoice ${invoice.invoiceNumber} for ${amount} from ${businessName} is due ${dueStr}. Please contact us if you have any questions.`;
  await sendTwilioMessage(to, body, channel);
}

export async function sendPaymentConfirmationSms(params: {
  to: string;
  channel: SmsChannel;
  businessName: string;
  client: { firstName: string };
  payment: { amount: number; invoiceNumber?: string };
}) {
  const { to, channel, businessName, client, payment } = params;
  const amount = `$${payment.amount.toFixed(2)}`;
  const ref = payment.invoiceNumber ? ` for invoice ${payment.invoiceNumber}` : '';

  const body = `Hi ${client.firstName}, your payment of ${amount}${ref} to ${businessName} has been received. Thank you!`;
  await sendTwilioMessage(to, body, channel);
}

export async function sendPaymentOverdueSms(params: {
  to: string;
  channel: SmsChannel;
  businessName: string;
  client: { firstName: string };
  invoice: { invoiceNumber: string; amountDue: number; dueDate: Date };
}) {
  const { to, channel, businessName, client, invoice } = params;
  const amount = `$${invoice.amountDue.toFixed(2)}`;
  const dueStr = invoice.dueDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });

  const body = `Hi ${client.firstName}, invoice ${invoice.invoiceNumber} for ${amount} from ${businessName} was due ${dueStr} and is now overdue. Please contact us to arrange payment.`;
  await sendTwilioMessage(to, body, channel);
}

export async function sendBookingConfirmationSms(params: {
  to: string;
  businessName: string;
  client: { firstName: string };
  appointment: { startTime: Date; serviceType: string; duration: number };
  therapist: { firstName: string; lastName: string };
}) {
  const { to, businessName, client, appointment, therapist } = params;
  const dateStr = appointment.startTime.toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const timeStr = appointment.startTime.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const body = `Hi ${client.firstName}, your ${appointment.serviceType} (${appointment.duration} min) with ${therapist.firstName} ${therapist.lastName} at ${businessName} is confirmed for ${dateStr} at ${timeStr}. See you then!`;
  await sendTwilioMessage(to, body, 'SMS');
}
