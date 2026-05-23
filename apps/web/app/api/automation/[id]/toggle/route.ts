import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const rule = await prisma.automationRule.findUnique({ where: { id: params.id } });
  if (!rule) return res.notFound('Automation rule not found');
  await requireBusinessAccess(user, rule.businessId);

  const updated = await prisma.automationRule.update({
    where: { id: params.id },
    data: { isActive: !rule.isActive },
  });

  return res.ok(updated);
});
