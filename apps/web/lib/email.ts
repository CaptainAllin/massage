import { Resend } from 'resend';
import { createMessageLog, markMessageLogSent, markMessageLogFailed, MessageChannel } from './message-log';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

export type ReportType = 'REVENUE' | 'CLIENTS' | 'THERAPISTS' | 'APPOINTMENTS' | 'FINANCIAL_SUMMARY';

function fmt(n: number) {
  return `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function buildReportHtml(
  businessName: string,
  reportName: string,
  reportType: ReportType,
  data: Record<string, any>,
  dateRange: { start: string; end: string },
): string {
  const tableRows = buildTableRows(reportType, data);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; color: #1a1a1a; }
  .card { background: #fff; border-radius: 8px; max-width: 640px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
  .meta { color: #666; font-size: 13px; margin: 0 0 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 8px 12px; background: #f9f9f9; font-weight: 600; color: #444; border-bottom: 2px solid #e5e5e5; }
  td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .footer { margin-top: 24px; font-size: 12px; color: #999; }
</style></head>
<body>
<div class="card">
  <h1>${reportName}</h1>
  <p class="meta">${businessName} &middot; ${dateRange.start} – ${dateRange.end}</p>
  <table>${tableRows}</table>
  <p class="footer">Generated automatically by Wellness CRM</p>
</div>
</body></html>`;
}

function buildTableRows(reportType: ReportType, data: Record<string, any>): string {
  switch (reportType) {
    case 'REVENUE': {
      const rows = [
        `<tr><th>Metric</th><th>Value</th></tr>`,
        `<tr><td>Total Revenue</td><td>${fmt(data.totalRevenue)}</td></tr>`,
        `<tr><td>Refunds</td><td>${fmt(data.refundsTotal)}</td></tr>`,
        `<tr><td>Tips</td><td>${fmt(data.tipsTotal)}</td></tr>`,
      ];
      if (data.byTherapist?.length) {
        rows.push(`<tr><td colspan="2" style="padding-top:16px;font-weight:600;color:#444">By Therapist</td></tr>`);
        rows.push(`<tr><th>Therapist</th><th>Revenue</th></tr>`);
        data.byTherapist.forEach((t: any) =>
          rows.push(`<tr><td>${t.therapistName}</td><td>${fmt(t.revenue)}</td></tr>`),
        );
      }
      return rows.join('');
    }

    case 'CLIENTS': {
      const rows = [
        `<tr><th>Metric</th><th>Value</th></tr>`,
        `<tr><td>New Clients</td><td>${data.newClients}</td></tr>`,
        `<tr><td>Returning Clients</td><td>${data.returningClients}</td></tr>`,
      ];
      if (data.topClients?.length) {
        rows.push(`<tr><td colspan="2" style="padding-top:16px;font-weight:600;color:#444">Top Clients</td></tr>`);
        rows.push(`<tr><th>Client</th><th>Total Spent</th></tr>`);
        data.topClients.slice(0, 5).forEach((c: any) =>
          rows.push(`<tr><td>${c.clientName}</td><td>${fmt(c.totalSpent)}</td></tr>`),
        );
      }
      return rows.join('');
    }

    case 'THERAPISTS': {
      const rows = [`<tr><th>Therapist</th><th>Sessions</th><th>Revenue</th><th>Utilization</th></tr>`];
      data.therapists?.forEach((t: any) =>
        rows.push(
          `<tr><td>${t.therapistName}</td><td>${t.sessionsCompleted}</td><td>${fmt(t.revenueGenerated)}</td><td>${pct(t.utilizationRate)}</td></tr>`,
        ),
      );
      return rows.join('');
    }

    case 'APPOINTMENTS': {
      const rows = [
        `<tr><th>Metric</th><th>Value</th></tr>`,
        `<tr><td>Total Appointments</td><td>${data.totalAppointments}</td></tr>`,
        `<tr><td>Average Duration</td><td>${data.averageDuration} min</td></tr>`,
      ];
      if (data.byStatus?.length) {
        rows.push(`<tr><td colspan="2" style="padding-top:16px;font-weight:600;color:#444">By Status</td></tr>`);
        rows.push(`<tr><th>Status</th><th>Count</th></tr>`);
        data.byStatus.forEach((s: any) =>
          rows.push(`<tr><td>${s.status}</td><td>${s.count} (${pct(s.percentage)})</td></tr>`),
        );
      }
      return rows.join('');
    }

    case 'FINANCIAL_SUMMARY': {
      const rows = [
        `<tr><th>Metric</th><th>Value</th></tr>`,
        `<tr><td>Gross Revenue</td><td>${fmt(data.grossRevenue)}</td></tr>`,
        `<tr><td>Net Revenue</td><td>${fmt(data.netRevenue)}</td></tr>`,
        `<tr><td>Refunds</td><td>${fmt(data.refunds)}</td></tr>`,
      ];
      if (data.paymentMethodBreakdown?.length) {
        rows.push(`<tr><td colspan="2" style="padding-top:16px;font-weight:600;color:#444">Payment Methods</td></tr>`);
        rows.push(`<tr><th>Method</th><th>Amount</th></tr>`);
        data.paymentMethodBreakdown.forEach((pm: any) =>
          rows.push(`<tr><td>${pm.method}</td><td>${fmt(pm.amount)} (${pct(pm.percentage)})</td></tr>`),
        );
      }
      return rows.join('');
    }

    default:
      return `<tr><td>No data available</td></tr>`;
  }
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export async function sendBookingConfirmation(params: {
  businessName: string;
  appointment: { id: string; startTime: Date; endTime: Date; duration: number; serviceType: string };
  client: { firstName: string; lastName: string; email: string | null };
  therapist: { firstName: string; lastName: string; email: string | null };
  businessId?: string;
  clientId?: string;
}) {
  const { businessName, appointment, client, therapist } = params;
  const dateStr = formatDateTime(appointment.startTime);
  const clientName = `${client.firstName} ${client.lastName}`;
  const therapistName = `${therapist.firstName} ${therapist.lastName}`;

  const clientHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; color: #1a1a1a; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  .sub { color: #555; font-size: 14px; margin: 0 0 24px; }
  .detail { background: #f9f9f9; border-radius: 6px; padding: 16px 20px; margin-bottom: 20px; }
  .detail p { margin: 6px 0; font-size: 14px; }
  .detail strong { display: inline-block; min-width: 120px; color: #444; }
  .footer { margin-top: 24px; font-size: 12px; color: #999; }
</style></head>
<body>
<div class="card">
  <h1>Booking Confirmed!</h1>
  <p class="sub">Hi ${clientName}, your appointment at ${businessName} is confirmed.</p>
  <div class="detail">
    <p><strong>Service:</strong> ${appointment.serviceType}</p>
    <p><strong>Date & Time:</strong> ${dateStr}</p>
    <p><strong>Duration:</strong> ${appointment.duration} minutes</p>
    <p><strong>Therapist:</strong> ${therapistName}</p>
  </div>
  <p style="font-size:14px;color:#555">If you need to cancel or reschedule, please contact ${businessName} directly.</p>
  <p class="footer">Powered by Wellness CRM</p>
</div>
</body></html>`;

  const therapistHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; color: #1a1a1a; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  .sub { color: #555; font-size: 14px; margin: 0 0 24px; }
  .detail { background: #f9f9f9; border-radius: 6px; padding: 16px 20px; margin-bottom: 20px; }
  .detail p { margin: 6px 0; font-size: 14px; }
  .detail strong { display: inline-block; min-width: 120px; color: #444; }
  .footer { margin-top: 24px; font-size: 12px; color: #999; }
</style></head>
<body>
<div class="card">
  <h1>New Booking</h1>
  <p class="sub">Hi ${therapistName}, you have a new appointment at ${businessName}.</p>
  <div class="detail">
    <p><strong>Client:</strong> ${clientName}</p>
    <p><strong>Service:</strong> ${appointment.serviceType}</p>
    <p><strong>Date & Time:</strong> ${dateStr}</p>
    <p><strong>Duration:</strong> ${appointment.duration} minutes</p>
  </div>
  <p class="footer">Powered by Wellness CRM</p>
</div>
</body></html>`;

  const sends: Promise<any>[] = [];

  if (client.email) {
    const subject = `Booking Confirmed — ${appointment.serviceType} at ${businessName}`;
    if (params.businessId) {
      const log = await createMessageLog({
        businessId: params.businessId,
        clientId: params.clientId,
        appointmentId: appointment.id,
        channel: MessageChannel.EMAIL,
        messageType: 'BOOKING_CONFIRMATION',
        recipient: client.email,
        subject,
      });
      sends.push(
        resend.emails
          .send({ from: FROM, to: [client.email], subject, html: clientHtml })
          .then((r) => {
            if (r.data?.id) markMessageLogSent(log.id, r.data.id);
            else markMessageLogFailed(log.id);
          })
          .catch((err) => markMessageLogFailed(log.id, err?.message)),
      );
    } else {
      sends.push(
        resend.emails.send({ from: FROM, to: [client.email], subject, html: clientHtml }),
      );
    }
  }

  if (therapist.email) {
    sends.push(
      resend.emails.send({
        from: FROM,
        to: [therapist.email],
        subject: `New Booking: ${clientName} — ${dateStr}`,
        html: therapistHtml,
      }),
    );
  }

  await Promise.all(sends);
}

export async function sendInvoiceEmail(params: {
  to: string;
  businessName: string;
  invoice: {
    invoiceNumber: string;
    total: number;
    amountDue: number;
    dueDate?: Date;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  };
  client: { firstName: string; lastName: string };
}) {
  const { to, businessName, invoice, client } = params;
  const clientName = `${client.firstName} ${client.lastName}`;
  const dueStr = invoice.dueDate
    ? invoice.dueDate.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'On receipt';

  const lineRows = invoice.lineItems
    .map(
      (li) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${li.description}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${li.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">${fmt(li.unitPrice)}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">${fmt(li.total)}</td></tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#1a1a1a}
  .card{background:#fff;border-radius:8px;max-width:640px;margin:0 auto;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  h1{font-size:22px;font-weight:700;margin:0 0 4px}
  .sub{color:#555;font-size:14px;margin:0 0 24px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{text-align:left;padding:8px 12px;background:#f9f9f9;font-weight:600;color:#444;border-bottom:2px solid #e5e5e5}
  th.right{text-align:right}th.center{text-align:center}
  .totals{margin-top:16px;text-align:right;font-size:14px}
  .totals p{margin:4px 0}
  .total-due{font-size:18px;font-weight:700;color:#1a1a1a;margin-top:8px}
  .footer{margin-top:24px;font-size:12px;color:#999}
</style></head>
<body><div class="card">
  <h1>Invoice ${invoice.invoiceNumber}</h1>
  <p class="sub">Hi ${clientName}, please find your invoice from ${businessName} below.</p>
  <table>
    <tr><th>Description</th><th class="center">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr>
    ${lineRows}
  </table>
  <div class="totals">
    <p>Subtotal: ${fmt(invoice.total)}</p>
    <p class="total-due">Amount Due: ${fmt(invoice.amountDue)}</p>
    <p style="color:#666;font-size:13px">Due: ${dueStr}</p>
  </div>
  <p class="footer">Please contact ${businessName} if you have any questions about this invoice.</p>
</div></body></html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Invoice ${invoice.invoiceNumber} from ${businessName} — ${fmt(invoice.amountDue)} due`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendMembershipRenewalReminder(params: {
  to: string;
  businessName: string;
  client: { firstName: string; lastName: string };
  membership: { name: string; price: number; currency: string; nextBillingDate: Date };
}) {
  const { to, businessName, client, membership } = params;
  const clientName = `${client.firstName} ${client.lastName}`;
  const renewalDate = membership.nextBillingDate.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#1a1a1a}
  .card{background:#fff;border-radius:8px;max-width:560px;margin:0 auto;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  h1{font-size:22px;font-weight:700;margin:0 0 8px}
  .sub{color:#555;font-size:14px;margin:0 0 24px}
  .detail{background:#f9f9f9;border-radius:6px;padding:16px 20px;margin-bottom:20px}
  .detail p{margin:6px 0;font-size:14px}
  .detail strong{display:inline-block;min-width:140px;color:#444}
  .footer{margin-top:24px;font-size:12px;color:#999}
</style></head>
<body><div class="card">
  <h1>Membership Renewal Reminder</h1>
  <p class="sub">Hi ${clientName}, your membership at ${businessName} is renewing soon.</p>
  <div class="detail">
    <p><strong>Membership:</strong> ${membership.name}</p>
    <p><strong>Renewal Date:</strong> ${renewalDate}</p>
    <p><strong>Amount:</strong> ${fmt(membership.price)} ${membership.currency}</p>
  </div>
  <p style="font-size:14px;color:#555">Your membership will automatically renew on the date above. Please contact ${businessName} if you wish to make any changes.</p>
  <p class="footer">Powered by Wellness CRM</p>
</div></body></html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Membership renewal in 7 days — ${membership.name} at ${businessName}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendInvoiceOverdueReminder(params: {
  to: string;
  businessName: string;
  client: { firstName: string; lastName: string };
  invoice: { invoiceNumber: string; amountDue: number; dueDate: Date };
}) {
  const { to, businessName, client, invoice } = params;
  const clientName = `${client.firstName} ${client.lastName}`;
  const dueStr = invoice.dueDate.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#1a1a1a}
  .card{background:#fff;border-radius:8px;max-width:560px;margin:0 auto;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  h1{font-size:22px;font-weight:700;margin:0 0 8px;color:#dc2626}
  .sub{color:#555;font-size:14px;margin:0 0 24px}
  .detail{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px 20px;margin-bottom:20px}
  .detail p{margin:6px 0;font-size:14px}
  .detail strong{display:inline-block;min-width:140px;color:#444}
  .footer{margin-top:24px;font-size:12px;color:#999}
</style></head>
<body><div class="card">
  <h1>Payment Overdue</h1>
  <p class="sub">Hi ${clientName}, invoice ${invoice.invoiceNumber} from ${businessName} is overdue.</p>
  <div class="detail">
    <p><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
    <p><strong>Amount Due:</strong> ${fmt(invoice.amountDue)}</p>
    <p><strong>Due Date:</strong> ${dueStr}</p>
  </div>
  <p style="font-size:14px;color:#555">Please arrange payment as soon as possible or contact ${businessName} to discuss payment options.</p>
  <p class="footer">Powered by Wellness CRM</p>
</div></body></html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Payment overdue — Invoice ${invoice.invoiceNumber} from ${businessName}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendReportEmail(params: {
  to: string[];
  businessName: string;
  reportName: string;
  reportType: ReportType;
  data: Record<string, any>;
  dateRange: { start: string; end: string };
}) {
  const { to, businessName, reportName, reportType, data, dateRange } = params;

  const html = buildReportHtml(businessName, reportName, reportType, data, dateRange);

  const { data: result, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${reportName} — ${dateRange.start} to ${dateRange.end}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return result;
}

export async function sendAppointmentReminderEmail(params: {
  to: string;
  businessName: string;
  client: { firstName: string; lastName: string };
  therapist: { firstName: string; lastName: string };
  appointment: { startTime: Date; endTime: Date; duration: number; serviceType: string | null };
  businessId?: string;
  clientId?: string;
  appointmentId?: string;
}) {
  const { to, businessName, client, therapist, appointment } = params;
  const dateStr = formatDateTime(appointment.startTime);
  const clientName = `${client.firstName} ${client.lastName}`;
  const therapistName = `${therapist.firstName} ${therapist.lastName}`;
  const serviceLabel = appointment.serviceType || 'Appointment';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; color: #1a1a1a; }
  .card { background: #fff; border-radius: 8px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  .sub { color: #555; font-size: 14px; margin: 0 0 24px; }
  .detail { background: #f9f9f9; border-radius: 6px; padding: 16px 20px; margin-bottom: 20px; }
  .detail p { margin: 6px 0; font-size: 14px; }
  .detail strong { display: inline-block; min-width: 120px; color: #444; }
  .footer { margin-top: 24px; font-size: 12px; color: #999; }
</style></head>
<body>
<div class="card">
  <h1>Appointment Reminder</h1>
  <p class="sub">Hi ${clientName}, this is a reminder of your upcoming appointment at ${businessName}.</p>
  <div class="detail">
    <p><strong>Service:</strong> ${serviceLabel}</p>
    <p><strong>Date & Time:</strong> ${dateStr}</p>
    <p><strong>Duration:</strong> ${appointment.duration} minutes</p>
    <p><strong>Therapist:</strong> ${therapistName}</p>
  </div>
  <p style="font-size:14px;color:#555">If you need to cancel or reschedule, please contact ${businessName} as soon as possible.</p>
  <p class="footer">Powered by Wellness CRM</p>
</div>
</body></html>`;

  const subject = `Reminder: ${serviceLabel} tomorrow at ${businessName}`;
  if (params.businessId) {
    const log = await createMessageLog({
      businessId: params.businessId,
      clientId: params.clientId,
      appointmentId: params.appointmentId,
      channel: MessageChannel.EMAIL,
      messageType: 'APPOINTMENT_REMINDER',
      recipient: to,
      subject,
    });
    const r = await resend.emails.send({ from: FROM, to: [to], subject, html });
    if (r.data?.id) await markMessageLogSent(log.id, r.data.id);
    else await markMessageLogFailed(log.id);
  } else {
    await resend.emails.send({ from: FROM, to: [to], subject, html });
  }
}
