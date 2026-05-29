import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/automation/analytics?businessId=...
export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    rulesActive,
    runsThisMonth,
    successThisMonth,
    failedThisMonth,
    reEngagementTriggers,
  ] = await Promise.all([
    prisma.automationRule.count({ where: { businessId, isActive: true } }),
    prisma.automationLog.count({ where: { businessId, executedAt: { gte: startOfMonth } } }),
    prisma.automationLog.count({ where: { businessId, status: 'SUCCESS', executedAt: { gte: startOfMonth } } }),
    prisma.automationLog.count({ where: { businessId, status: 'FAILED', executedAt: { gte: startOfMonth } } }),
    // Re-engagement logs (last 60 days) to compute revenue attribution
    prisma.automationLog.findMany({
      where: {
        businessId,
        status: 'SUCCESS',
        executedAt: { gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
        rule: {
          trigger: { in: ['CLIENT_RECALL_DUE', 'CLIENT_INACTIVE', 'CLIENT_BIRTHDAY'] },
        },
      },
      select: { triggerData: true, executedAt: true },
      take: 500,
    }),
  ]);

  // Revenue attribution: count unique clients who booked after a re-engagement touch within 7 days
  const reEngagedClientIds = new Set<string>();
  for (const log of reEngagementTriggers) {
    const td = log.triggerData as Record<string, any>;
    const clientId = td?.clientId;
    if (!clientId) continue;
    const windowEnd = new Date(log.executedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const followedUp = await prisma.automationLog.findFirst({
      where: {
        businessId,
        status: 'SUCCESS',
        executedAt: { gte: log.executedAt, lte: windowEnd },
        rule: { trigger: 'APPOINTMENT_BOOKED' },
        triggerData: { path: ['clientId'], equals: clientId },
      },
    });
    if (followedUp) reEngagedClientIds.add(clientId);
  }

  const successRate = runsThisMonth > 0
    ? Math.round((successThisMonth / runsThisMonth) * 100)
    : 0;

  return res.ok({
    rulesActive,
    runsThisMonth,
    successRate,
    failedThisMonth,
    revenueAttributed: reEngagedClientIds.size,
  });
});
