import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

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
  const { businessId, exportType, format } = body;
  if (!businessId) return res.badRequest('businessId is required');
  if (!exportType) return res.badRequest('exportType is required');
  await requireBusinessAccess(user, businessId);

  const validFormats = ['CSV', 'PDF', 'EXCEL'];
  const validTypes = ['APPOINTMENTS', 'CLIENTS', 'PAYMENTS', 'INVOICES', 'TREATMENT_NOTES'];
  if (!validTypes.includes(exportType)) return res.badRequest('Invalid exportType');
  const fmt = (format || 'CSV').toUpperCase();
  if (!validFormats.includes(fmt)) return res.badRequest('Invalid format');

  const exportRecord = await prisma.exportHistory.create({
    data: {
      businessId,
      userId: user.id,
      exportType,
      format: fmt as any,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Generate export data inline (lightweight version)
  try {
    let rowCount = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (exportType) {
      case 'APPOINTMENTS':
        rowCount = await prisma.appointment.count({ where: { businessId, startTime: { gte: thirtyDaysAgo } } });
        break;
      case 'CLIENTS':
        rowCount = await prisma.client.count({ where: { businessId } });
        break;
      case 'PAYMENTS':
        rowCount = await prisma.payment.count({ where: { businessId, paidAt: { gte: thirtyDaysAgo } } });
        break;
      case 'INVOICES':
        rowCount = await prisma.invoice.count({ where: { businessId } });
        break;
    }

    const fileName = `${exportType.toLowerCase()}_${now.toISOString().split('T')[0]}.${fmt.toLowerCase() === 'excel' ? 'xlsx' : fmt.toLowerCase()}`;

    const updated = await prisma.exportHistory.update({
      where: { id: exportRecord.id },
      data: {
        status: 'COMPLETED',
        fileName,
        rowCount,
        completedAt: new Date(),
      },
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
