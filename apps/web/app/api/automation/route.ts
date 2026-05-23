import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const rules = await prisma.automationRule.findMany({
    where: { businessId },
    include: {
      logs: {
        orderBy: { executedAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok({ rules });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, name, description, trigger, conditions, actions } = body;
  if (!businessId || !name || !trigger || !actions) {
    return res.badRequest('businessId, name, trigger, and actions are required');
  }
  await requireBusinessAccess(user, businessId);

  const rule = await prisma.automationRule.create({
    data: { businessId, name, description, trigger, conditions: conditions ?? {}, actions },
  });

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'AUTOMATION_RULE_CREATED',
    entityType: 'AutomationRule',
    entityId: rule.id,
    metadata: { name, trigger },
  });

  return res.created(rule);
});
