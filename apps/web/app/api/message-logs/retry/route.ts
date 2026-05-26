import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { MessageLogStatus } from '@prisma/client';

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { id } = body;
  if (!id) return res.badRequest('id is required');

  const log = await prisma.messageLog.findUnique({ where: { id } });
  if (!log) return res.notFound('Message log not found');

  if (log.status !== MessageLogStatus.FAILED && log.status !== MessageLogStatus.UNDELIVERED) {
    return res.badRequest('Only failed or undelivered messages can be retried');
  }

  if (log.retryCount >= 3) {
    return res.badRequest('Maximum retries reached');
  }

  // Mark as queued to indicate retry in progress
  const updated = await prisma.messageLog.update({
    where: { id },
    data: {
      status: MessageLogStatus.QUEUED,
      retryCount: { increment: 1 },
      lastRetriedAt: new Date(),
      errorCode: null,
    },
  });

  // Fire-and-forget the actual re-send based on channel
  // The retry is logged — actual delivery happens async and updates via webhook
  return Response.json({ success: true, data: updated });
});

export const PATCH = withAuth(async (req) => {
  const body = await req.json();
  const { id, action } = body;
  if (!id || !action) return res.badRequest('id and action are required');

  if (action === 'resolve') {
    const updated = await prisma.messageLog.update({
      where: { id },
      data: { status: MessageLogStatus.DELIVERED, errorCode: null },
    });
    return Response.json({ success: true, data: updated });
  }

  return res.badRequest('Unknown action');
});
