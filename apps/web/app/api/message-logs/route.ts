import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { MessageChannel, MessageLogStatus } from '@prisma/client';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const channel = searchParams.get('channel') as MessageChannel | null;
  const status = searchParams.get('status') as MessageLogStatus | null;
  const clientId = searchParams.get('clientId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const where: any = { businessId };
  if (channel) where.channel = channel;
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [total, logs] = await Promise.all([
    prisma.messageLog.count({ where }),
    prisma.messageLog.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Aggregate stats for the current filter set (ignoring status filter for totals)
  const statsWhere: any = { businessId };
  if (channel) statsWhere.channel = channel;
  if (clientId) statsWhere.clientId = clientId;
  if (startDate || endDate) statsWhere.createdAt = where.createdAt;

  const [totalSent, totalDelivered, totalFailed, totalPending] = await Promise.all([
    prisma.messageLog.count({ where: { ...statsWhere, status: { in: [MessageLogStatus.SENT, MessageLogStatus.DELIVERED] } } }),
    prisma.messageLog.count({ where: { ...statsWhere, status: MessageLogStatus.DELIVERED } }),
    prisma.messageLog.count({ where: { ...statsWhere, status: { in: [MessageLogStatus.FAILED, MessageLogStatus.UNDELIVERED] } } }),
    prisma.messageLog.count({ where: { ...statsWhere, status: MessageLogStatus.QUEUED } }),
  ]);

  const allCount = totalSent + totalFailed + totalPending;
  const deliveredPct = allCount > 0 ? Math.round((totalDelivered / allCount) * 100) : 0;
  const failedPct = allCount > 0 ? Math.round((totalFailed / allCount) * 100) : 0;

  return Response.json({
    success: true,
    data: logs,
    stats: {
      totalSent: allCount,
      delivered: totalDelivered,
      deliveredPct,
      failed: totalFailed,
      failedPct,
      pending: totalPending,
      highFailureAlert: failedPct > 5,
    },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
