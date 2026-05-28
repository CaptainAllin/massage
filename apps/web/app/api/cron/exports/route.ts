import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { res } from '@/lib/api-auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const EXPORT_TYPE_LABELS: Record<string, string> = {
  APPOINTMENTS: 'Appointments',
  CLIENTS: 'Clients',
  PAYMENTS: 'Payments',
  INVOICES: 'Invoices & Payments',
  TREATMENT_NOTES: 'Treatment Notes',
  FULL_PRACTICE: 'Full Practice Data',
};

function computeNextRunAt(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case 'DAILY':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'WEEKLY':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'MONTHLY': {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      return next;
    }
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

async function countRows(businessId: string, exportType: string, filters: Record<string, string>): Promise<number> {
  const f = filters ?? {};
  const dateFilter =
    f.dateFrom || f.dateTo
      ? {
          ...(f.dateFrom ? { gte: new Date(f.dateFrom) } : {}),
          ...(f.dateTo ? { lte: new Date(f.dateTo + 'T23:59:59Z') } : {}),
        }
      : undefined;

  switch (exportType) {
    case 'CLIENTS':
      return prisma.client.count({ where: { businessId } });
    case 'APPOINTMENTS':
      return prisma.appointment.count({
        where: { businessId, ...(dateFilter ? { startTime: dateFilter } : {}), ...(f.status ? { status: f.status as any } : {}) },
      });
    case 'PAYMENTS':
      return prisma.payment.count({
        where: { businessId, ...(dateFilter ? { paidAt: dateFilter } : {}), ...(f.status ? { status: f.status as any } : {}) },
      });
    case 'INVOICES':
      return prisma.invoice.count({
        where: { businessId, ...(dateFilter ? { createdAt: dateFilter } : {}), ...(f.status ? { status: f.status as any } : {}) },
      });
    case 'TREATMENT_NOTES':
      return prisma.treatmentNote.count({
        where: {
          businessId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          ...(f.therapistId ? { therapistId: f.therapistId } : {}),
          ...(f.clientId ? { clientId: f.clientId } : {}),
        },
      });
    case 'FULL_PRACTICE': {
      const [c, a, i, t] = await Promise.all([
        prisma.client.count({ where: { businessId } }),
        prisma.appointment.count({ where: { businessId } }),
        prisma.invoice.count({ where: { businessId } }),
        prisma.treatmentNote.count({ where: { businessId } }),
      ]);
      return c + a + i + t;
    }
    default:
      return 0;
  }
}

// Runs on a schedule (e.g., every hour via Vercel Cron) to process due scheduled exports
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return res.unauthorized('Invalid cron secret');

  const now = new Date();

  const dueSched = await prisma.scheduledExport.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
    include: { business: { select: { name: true } } },
  });

  const results: { id: string; status: string; error?: string }[] = [];

  for (const sched of dueSched) {
    try {
      const filters = (sched.filters as Record<string, string>) ?? {};
      const rowCount = await countRows(sched.businessId, sched.exportType, filters);
      const ext =
        sched.exportType === 'FULL_PRACTICE'
          ? 'zip'
          : sched.format === 'EXCEL'
          ? 'xlsx'
          : sched.format.toLowerCase();
      const dateStamp = now.toISOString().split('T')[0];
      const fileName = `${sched.exportType.toLowerCase()}_${dateStamp}.${ext}`;
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const exportRecord = await prisma.exportHistory.create({
        data: {
          businessId: sched.businessId,
          userId: sched.userId,
          exportType: sched.exportType,
          format: sched.format,
          status: 'COMPLETED',
          filters: sched.filters as any,
          fileName,
          rowCount,
          completedAt: now,
          expiresAt,
          triggeredBy: 'SCHEDULED',
        },
      });

      const downloadUrl = `${APP_URL}/api/exports/${exportRecord.id}/download`;
      const typeLabel = EXPORT_TYPE_LABELS[sched.exportType] ?? sched.exportType;
      const expiryDate = expiresAt.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

      await resend.emails.send({
        from: FROM,
        to: sched.emailTo,
        subject: `Your scheduled ${typeLabel} export is ready`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fff;">
  <div style="margin-bottom: 24px;">
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.4px; color: #5D4AA8; margin-bottom: 4px;">Scheduled Export</div>
    <h1 style="font-size: 20px; font-weight: 600; color: #1E1830; margin: 0;">${typeLabel} Export Ready</h1>
  </div>
  <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
    Your scheduled <strong>${sched.name}</strong> export from <strong>${sched.business.name}</strong> has been generated and is ready for download.
  </p>
  <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px; font-size: 13px;">
    <tr style="border-bottom: 1px solid #F3F4F6;">
      <td style="padding: 8px 0; color: #6B7280;">Data type</td>
      <td style="padding: 8px 0; color: #111827; font-weight: 500; text-align: right;">${typeLabel}</td>
    </tr>
    <tr style="border-bottom: 1px solid #F3F4F6;">
      <td style="padding: 8px 0; color: #6B7280;">Format</td>
      <td style="padding: 8px 0; color: #111827; font-weight: 500; text-align: right;">${sched.format}</td>
    </tr>
    <tr style="border-bottom: 1px solid #F3F4F6;">
      <td style="padding: 8px 0; color: #6B7280;">Records</td>
      <td style="padding: 8px 0; color: #111827; font-weight: 500; text-align: right;">${rowCount.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6B7280;">Link expires</td>
      <td style="padding: 8px 0; color: #111827; font-weight: 500; text-align: right;">${expiryDate}</td>
    </tr>
  </table>
  <a href="${downloadUrl}" style="display: block; text-align: center; padding: 12px 24px; background: #5D4AA8; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
    Download Export
  </a>
  <p style="color: #9CA3AF; font-size: 12px; margin: 24px 0 0; text-align: center;">
    This download link expires in 7 days. Log in to <a href="${APP_URL}/exports" style="color: #5D4AA8;">manage your scheduled exports</a>.
  </p>
</div>`,
      });

      await prisma.scheduledExport.update({
        where: { id: sched.id },
        data: { lastRunAt: now, nextRunAt: computeNextRunAt(sched.frequency) },
      });

      results.push({ id: sched.id, status: 'sent' });
    } catch (err) {
      console.error(`[cron/exports] Failed for scheduled export ${sched.id}:`, err);
      results.push({ id: sched.id, status: 'error', error: String(err) });
    }
  }

  return res.ok({ processed: dueSched.length, results });
}
