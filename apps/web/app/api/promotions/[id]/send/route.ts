import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

function applyVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

type ClientRow = Awaited<ReturnType<typeof prisma.client.findMany>>[number];

async function resolveRecipients(businessId: string, filter: any): Promise<ClientRow[]> {
  const base = { businessId, isActive: true };

  if (filter.type === 'custom' && Array.isArray(filter.clientIds) && filter.clientIds.length > 0) {
    return prisma.client.findMany({ where: { ...base, id: { in: filter.clientIds } } });
  }

  if (filter.type === 'inactive' && filter.daysInactive) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filter.daysInactive);
    return prisma.client.findMany({
      where: { ...base, OR: [{ lastVisitDate: { lt: cutoff } }, { lastVisitDate: null }] },
    });
  }

  return prisma.client.findMany({ where: base });
}

export const POST = withAuth(async (req, _user, ctx) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const promotion = await prisma.promotion.findFirst({
    where: { id: ctx.params.id, businessId },
  });
  if (!promotion) return res.notFound('Promotion not found');
  if (promotion.status === 'SENT' || promotion.status === 'SENDING') {
    return res.badRequest('Promotion has already been sent');
  }
  if (promotion.status === 'CANCELLED') {
    return res.badRequest('Cannot send a cancelled promotion');
  }

  const body = await req.json().catch(() => ({}));
  const isPreview = body.preview === true;
  const previewEmail = body.previewEmail as string | undefined;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true, email: true },
  });

  if (isPreview) {
    if (!previewEmail) return res.badRequest('previewEmail required for preview mode');
    const vars = {
      clientName: 'Jane Smith',
      businessName: business?.name ?? 'Your Business',
      offerText: '[Your offer here]',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
    };
    const renderedSubject = applyVariables(promotion.subject ?? promotion.name, vars);
    const renderedBody = applyVariables(promotion.body, vars);

    if (promotion.channel === 'EMAIL') {
      await resend.emails.send({
        from: FROM,
        to: [previewEmail],
        subject: `[PREVIEW] ${renderedSubject}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${renderedBody.replace(/\n/g, '<br>')}</div>`,
      });
    }

    return res.ok({ preview: true, renderedSubject, renderedBody });
  }

  // Mark as SENDING
  await prisma.promotion.update({ where: { id: promotion.id }, data: { status: 'SENDING' } });

  const recipients = await resolveRecipients(businessId, promotion.recipientFilter as any);

  let sent = 0;
  let failed = 0;

  for (const client of recipients) {
    const vars = {
      clientName: `${client.firstName} ${client.lastName}`.trim(),
      businessName: business?.name ?? 'Your Business',
      offerText: '',
      expiryDate: '',
    };

    const renderedSubject = applyVariables(promotion.subject ?? promotion.name, vars);
    const renderedBody = applyVariables(promotion.body, vars);

    let status = 'SENT';
    let failureReason: string | undefined;

    try {
      if (promotion.channel === 'EMAIL' && client.email) {
        await resend.emails.send({
          from: FROM,
          to: [client.email],
          subject: renderedSubject,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${renderedBody.replace(/\n/g, '<br>')}</div>`,
        });
      } else if (promotion.channel === 'SMS' && client.phoneNumber && process.env.ENABLE_TWILIO === 'true') {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ Body: renderedBody, From: process.env.TWILIO_FROM_NUMBER!, To: client.phoneNumber }),
          }
        );
        if (!twilioRes.ok) throw new Error(`Twilio ${twilioRes.status}`);
      } else if (!client.email && !client.phoneNumber) {
        status = 'FAILED';
        failureReason = 'No contact info';
      }
      if (status === 'SENT') sent++;
    } catch (err: any) {
      status = 'FAILED';
      failureReason = err.message;
      failed++;
    }

    await prisma.promotionRecipient.upsert({
      where: { promotionId_clientId: { promotionId: promotion.id, clientId: client.id } },
      create: {
        promotionId: promotion.id,
        clientId: client.id,
        status,
        sentAt: status === 'SENT' ? new Date() : null,
        failureReason: failureReason ?? null,
      },
      update: {
        status,
        sentAt: status === 'SENT' ? new Date() : null,
        failureReason: failureReason ?? null,
      },
    });
  }

  await prisma.promotion.update({
    where: { id: promotion.id },
    data: { status: 'SENT', sentAt: new Date(), totalSent: sent },
  });

  return res.ok({ sent, failed, total: recipients.length });
});
