import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VALID_TYPES = ['APPOINTMENTS', 'CLIENTS', 'PAYMENTS', 'INVOICES', 'TREATMENT_NOTES', 'FULL_PRACTICE'];
const VALID_FORMATS = ['CSV', 'PDF', 'JSON', 'EXCEL'];
const VALID_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'];

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

export const GET = withAuth(async (req: NextRequest, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const schedules = await prisma.scheduledExport.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok(schedules);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { businessId, name, exportType, format, frequency, filters, emailTo } = body;

  if (!businessId) return res.badRequest('businessId is required');
  if (!name?.trim()) return res.badRequest('name is required');
  if (!exportType) return res.badRequest('exportType is required');
  if (!frequency) return res.badRequest('frequency is required');
  if (!emailTo?.trim()) return res.badRequest('emailTo is required');

  await requireBusinessAccess(user, businessId);

  if (!VALID_TYPES.includes(exportType)) return res.badRequest('Invalid exportType');
  const fmt = (format || 'CSV').toUpperCase();
  if (!VALID_FORMATS.includes(fmt)) return res.badRequest('Invalid format');
  if (!VALID_FREQUENCIES.includes(frequency)) return res.badRequest('Invalid frequency');

  const schedule = await prisma.scheduledExport.create({
    data: {
      businessId,
      userId: user.id,
      name: name.trim(),
      exportType,
      format: fmt as any,
      frequency: frequency as any,
      filters: filters ?? null,
      emailTo: emailTo.trim(),
      nextRunAt: computeNextRunAt(frequency),
    },
  });

  return res.created(schedule);
});
