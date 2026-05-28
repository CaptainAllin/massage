import { createMessageLog, markMessageLogSent, markMessageLogFailed, MessageChannel } from './message-log';
import { canSendSms, consumeSmsCredit, maybeSendOverageWarning, SMS_COST_PER_MESSAGE } from './sms-credits';

export type SmsChannel = 'SMS' | 'WHATSAPP';

interface TwilioMessageResponse {
  sid: string;
  status: string;
}

async function sendTwilioMessage(
  to: string,
  body: string,
  channel: SmsChannel = 'SMS',
): Promise<TwilioMessageResponse | null> {
  if (process.env.ENABLE_TWILIO !== 'true') return null;
  if (!to) return null;

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
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio ${response.status}: ${text}`);
  }

  return response.json() as Promise<TwilioMessageResponse>;
}

interface LoggedSmsParams {
  businessId: string;
  clientId?: string | null;
  appointmentId?: string | null;
  messageType: string;
}

async function sendAndLog(
  to: string,
  body: string,
  channel: SmsChannel,
  logParams: LoggedSmsParams,
): Promise<void> {
  // Check SMS credits before sending (only for SMS, not WhatsApp)
  if (channel === 'SMS') {
    const creditCheck = await canSendSms(logParams.businessId);
    if (!creditCheck.allowed) {
      console.warn(`SMS blocked for business ${logParams.businessId}: ${creditCheck.reason}`);
      return;
    }
  }

  const msgChannel = channel === 'WHATSAPP' ? MessageChannel.WHATSAPP : MessageChannel.SMS;
  const log = await createMessageLog({
    businessId: logParams.businessId,
    clientId: logParams.clientId,
    appointmentId: logParams.appointmentId,
    channel: msgChannel,
    messageType: logParams.messageType,
    recipient: to,
  });

  try {
    const result = await sendTwilioMessage(to, body, channel);
    if (result?.sid) {
      await markMessageLogSent(log.id, result.sid);
      // Track credit consumption and cost for SMS messages
      if (channel === 'SMS') {
        await consumeSmsCredit(logParams.businessId, SMS_COST_PER_MESSAGE);
        // Fire-and-forget overage warning check
        maybeSendOverageWarning(logParams.businessId).catch(() => {});
      }
    }
  } catch (err: any) {
    await markMessageLogFailed(log.id, err?.message ?? 'UNKNOWN');
    throw err;
  }
}

export async function sendInvoiceSms(params: {
  to: string;
  channel: SmsChannel;
  businessName: string;
  client: { firstName: string; lastName: string };
  invoice: { invoiceNumber: string; amountDue: number; dueDate?: Date | null };
  businessId?: string;
  clientId?: string;
}) {
  const { to, channel, businessName, client, invoice } = params;
  const dueStr = invoice.dueDate
    ? invoice.dueDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'on receipt';
  const amount = `$${invoice.amountDue.toFixed(2)}`;

  const body = `Hi ${client.firstName}, invoice ${invoice.invoiceNumber} for ${amount} from ${businessName} is due ${dueStr}. Please contact us if you have any questions.`;

  if (params.businessId) {
    await sendAndLog(to, body, channel, {
      businessId: params.businessId,
      clientId: params.clientId,
      messageType: 'INVOICE',
    });
  } else {
    await sendTwilioMessage(to, body, channel);
  }
}

export async function sendPaymentConfirmationSms(params: {
  to: string;
  channel: SmsChannel;
  businessName: string;
  client: { firstName: string };
  payment: { amount: number; invoiceNumber?: string };
  businessId?: string;
  clientId?: string;
}) {
  const { to, channel, businessName, client, payment } = params;
  const amount = `$${payment.amount.toFixed(2)}`;
  const ref = payment.invoiceNumber ? ` for invoice ${payment.invoiceNumber}` : '';

  const body = `Hi ${client.firstName}, your payment of ${amount}${ref} to ${businessName} has been received. Thank you!`;

  if (params.businessId) {
    await sendAndLog(to, body, channel, {
      businessId: params.businessId,
      clientId: params.clientId,
      messageType: 'PAYMENT_CONFIRMATION',
    });
  } else {
    await sendTwilioMessage(to, body, channel);
  }
}

export async function sendPaymentOverdueSms(params: {
  to: string;
  channel: SmsChannel;
  businessName: string;
  client: { firstName: string };
  invoice: { invoiceNumber: string; amountDue: number; dueDate: Date };
  businessId?: string;
  clientId?: string;
}) {
  const { to, channel, businessName, client, invoice } = params;
  const amount = `$${invoice.amountDue.toFixed(2)}`;
  const dueStr = invoice.dueDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });

  const body = `Hi ${client.firstName}, invoice ${invoice.invoiceNumber} for ${amount} from ${businessName} was due ${dueStr} and is now overdue. Please contact us to arrange payment.`;

  if (params.businessId) {
    await sendAndLog(to, body, channel, {
      businessId: params.businessId,
      clientId: params.clientId,
      messageType: 'PAYMENT_OVERDUE',
    });
  } else {
    await sendTwilioMessage(to, body, channel);
  }
}

export async function sendBookingConfirmationSms(params: {
  to: string;
  businessName: string;
  client: { firstName: string };
  appointment: { startTime: Date; serviceType: string; duration: number };
  therapist: { firstName: string; lastName: string };
  businessId?: string;
  clientId?: string;
  appointmentId?: string;
}) {
  const { to, businessName, client, appointment, therapist } = params;
  const dateStr = appointment.startTime.toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const timeStr = appointment.startTime.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const body = `Hi ${client.firstName}, your ${appointment.serviceType} (${appointment.duration} min) with ${therapist.firstName} ${therapist.lastName} at ${businessName} is confirmed for ${dateStr} at ${timeStr}. See you then!`;

  if (params.businessId) {
    await sendAndLog(to, body, 'SMS', {
      businessId: params.businessId,
      clientId: params.clientId,
      appointmentId: params.appointmentId,
      messageType: 'BOOKING_CONFIRMATION',
    });
  } else {
    await sendTwilioMessage(to, body, 'SMS');
  }
}

export async function sendAppointmentReminderSms(params: {
  to: string;
  channel?: SmsChannel;
  businessName: string;
  client: { firstName: string };
  therapist: { firstName: string; lastName: string };
  appointment: { startTime: Date; serviceType: string | null; duration: number };
  businessId?: string;
  clientId?: string;
  appointmentId?: string;
}) {
  const { to, channel = 'SMS', businessName, client, therapist, appointment } = params;
  const dateStr = appointment.startTime.toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const timeStr = appointment.startTime.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const serviceLabel = appointment.serviceType || 'appointment';
  const body = `Hi ${client.firstName}, reminder: your ${serviceLabel} (${appointment.duration} min) with ${therapist.firstName} ${therapist.lastName} at ${businessName} is tomorrow, ${dateStr} at ${timeStr}. Reply STOP to unsubscribe.`;

  if (params.businessId) {
    await sendAndLog(to, body, channel, {
      businessId: params.businessId,
      clientId: params.clientId,
      appointmentId: params.appointmentId,
      messageType: 'APPOINTMENT_REMINDER',
    });
  } else {
    await sendTwilioMessage(to, body, channel);
  }
}
