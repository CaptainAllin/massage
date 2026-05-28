import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const VALID_TYPES = ['APPOINTMENTS', 'CLIENTS', 'PAYMENTS', 'INVOICES', 'TREATMENT_NOTES', 'FULL_PRACTICE'];
const VALID_FORMATS = ['CSV', 'PDF', 'JSON', 'EXCEL'];

export const GET = withAuth(async (req: NextRequest, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const exports = await prisma.exportHistory.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return res.ok(exports);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { businessId, exportType, format, filters, triggeredBy } = body;

  if (!businessId) return res.badRequest('businessId is required');
  if (!exportType) return res.badRequest('exportType is required');
  await requireBusinessAccess(user, businessId);

  if (!VALID_TYPES.includes(exportType)) return res.badRequest('Invalid exportType');
  const fmt = (format || 'CSV').toUpperCase();
  if (!VALID_FORMATS.includes(fmt)) return res.badRequest('Invalid format');

  const now = new Date();
  const exportRecord = await prisma.exportHistory.create({
    data: {
      businessId,
      userId: user.id,
      exportType,
      format: fmt as any,
      status: 'PENDING',
      filters: filters ?? null,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      triggeredBy: triggeredBy ?? 'MANUAL',
    },
  });

  // Count rows to give feedback; actual data is generated at download time
  try {
    let rowCount = 0;
    const f = filters ?? {};
    const dateFilter = f.dateFrom || f.dateTo
      ? {
          ...(f.dateFrom ? { gte: new Date(f.dateFrom) } : {}),
          ...(f.dateTo ? { lte: new Date(f.dateTo + 'T23:59:59Z') } : {}),
        }
      : undefined;

    switch (exportType) {
      case 'APPOINTMENTS':
        rowCount = await prisma.appointment.count({
          where: {
            businessId,
            ...(dateFilter ? { startTime: dateFilter } : {}),
            ...(f.therapistId ? { therapistId: f.therapistId } : {}),
            ...(f.status ? { status: f.status } : {}),
          },
        });
        break;
      case 'CLIENTS':
        rowCount = await prisma.client.count({ where: { businessId } });
        break;
      case 'PAYMENTS':
        rowCount = await prisma.payment.count({
          where: {
            businessId,
            ...(dateFilter ? { paidAt: dateFilter } : {}),
            ...(f.status ? { status: f.status } : {}),
          },
        });
        break;
      case 'INVOICES':
        rowCount = await prisma.invoice.count({
          where: {
            businessId,
            ...(dateFilter ? { createdAt: dateFilter } : {}),
            ...(f.status ? { status: f.status } : {}),
          },
        });
        break;
      case 'TREATMENT_NOTES':
        rowCount = await prisma.treatmentNote.count({
          where: {
            businessId,
            ...(dateFilter ? { createdAt: dateFilter } : {}),
            ...(f.therapistId ? { therapistId: f.therapistId } : {}),
            ...(f.clientId ? { clientId: f.clientId } : {}),
          },
        });
        break;
      case 'FULL_PRACTICE': {
        const [c, a, i, t] = await Promise.all([
          prisma.client.count({ where: { businessId } }),
          prisma.appointment.count({ where: { businessId } }),
          prisma.invoice.count({ where: { businessId } }),
          prisma.treatmentNote.count({ where: { businessId } }),
        ]);
        rowCount = c + a + i + t;
        break;
      }
    }

    const ext = exportType === 'FULL_PRACTICE' ? 'zip' : fmt === 'EXCEL' ? 'xlsx' : fmt.toLowerCase();
    const fileName = `${exportType.toLowerCase()}_${now.toISOString().split('T')[0]}.${ext}`;

    const updated = await prisma.exportHistory.update({
      where: { id: exportRecord.id },
      data: { status: 'COMPLETED', fileName, rowCount, completedAt: new Date() },
    });

    return res.ok(updated);
  } catch (err) {
    await prisma.exportHistory.update({
      where: { id: exportRecord.id },
      data: { status: 'FAILED', errorMessage: String(err) },
    });
    return res.error('Export failed');
  }
});
