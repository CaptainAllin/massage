import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { emitAutomation } from '@/lib/automation';

// POST /api/automation/logs/rerun — replay a failed execution with same triggerData
export const POST = withAuth(async (req, user) => {
  const { logId } = await req.json();
  if (!logId) return res.badRequest('logId is required');

  const log = await prisma.automationLog.findUnique({
    where: { id: logId },
    include: { rule: true },
  });
  if (!log) return res.notFound('Log not found');
  await requireBusinessAccess(user, log.businessId);

  const triggerData = (log.triggerData as Record<string, any>) ?? {};
  emitAutomation(log.rule.trigger, log.businessId, { ...triggerData, businessId: log.businessId });

  return res.ok({ replayed: true, trigger: log.rule.trigger });
});
