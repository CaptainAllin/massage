import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const accounts = await prisma.loyaltyAccount.findMany({
    where: { businessId },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { points: 'desc' },
  });

  return res.ok(accounts);
});
