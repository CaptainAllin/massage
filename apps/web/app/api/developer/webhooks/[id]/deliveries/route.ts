import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user, ctx) => {
  const id = ctx?.params?.id as string;
  const wh = await prisma.webhook.findUnique({ where: { id }, include: { business: { select: { ownerId: true } } } });
  if (!wh) return res.notFound();
  if (wh.business.ownerId !== user.id) return res.forbidden();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 25;

  const [total, deliveries] = await Promise.all([
    prisma.webhookDelivery.count({ where: { webhookId: id } }),
    prisma.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { attemptedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.ok({ deliveries, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
