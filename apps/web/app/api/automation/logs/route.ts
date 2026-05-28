import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/automation/logs?businessId=...&page=1&limit=50
export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const [total, logs] = await Promise.all([
    prisma.automationLog.count({ where: { businessId } }),
    prisma.automationLog.findMany({
      where: { businessId },
      include: {
        rule: { select: { name: true, trigger: true } },
      },
      orderBy: { executedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.ok({ logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
