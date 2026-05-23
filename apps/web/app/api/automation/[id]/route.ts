import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const rule = await prisma.automationRule.findUnique({
    where: { id: params.id },
    include: {
      logs: { orderBy: { executedAt: 'desc' }, take: 20 },
    },
  });
  if (!rule) return res.notFound('Automation rule not found');
  await requireBusinessAccess(user, rule.businessId);
  return res.ok(rule);
});

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const rule = await prisma.automationRule.findUnique({ where: { id: params.id } });
  if (!rule) return res.notFound('Automation rule not found');
  await requireBusinessAccess(user, rule.businessId);

  const body = await req.json();
  const { name, description, trigger, conditions, actions } = body;

  const updated = await prisma.automationRule.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(trigger && { trigger }),
      ...(conditions !== undefined && { conditions }),
      ...(actions && { actions }),
    },
  });

  return res.ok(updated);
});

export const DELETE = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const rule = await prisma.automationRule.findUnique({ where: { id: params.id } });
  if (!rule) return res.notFound('Automation rule not found');
  await requireBusinessAccess(user, rule.businessId);

  await prisma.automationRule.delete({ where: { id: params.id } });

  await logAudit(req, {
    userId: user.id,
    businessId: rule.businessId,
    action: 'AUTOMATION_RULE_DELETED',
    entityType: 'AutomationRule',
    entityId: rule.id,
    metadata: { name: rule.name },
  });

  return res.ok({ deleted: true });
});
