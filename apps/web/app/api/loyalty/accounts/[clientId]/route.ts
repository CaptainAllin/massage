import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

function computeTier(points: number, settings: { bronzeMinPoints: number; silverMinPoints: number; goldMinPoints: number } | null) {
  if (!settings) return 'BRONZE';
  if (points >= settings.goldMinPoints) return 'GOLD';
  if (points >= settings.silverMinPoints) return 'SILVER';
  return 'BRONZE';
}

export const GET = withAuth(async (req, user, { params }: { params: { clientId: string } }) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const [account, settings] = await Promise.all([
    prisma.loyaltyAccount.findUnique({
      where: { businessId_clientId: { businessId, clientId: params.clientId } },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.loyaltySettings.findUnique({ where: { businessId } }),
  ]);

  if (!account) {
    return res.ok({ points: 0, lifetimePoints: 0, tier: 'BRONZE', transactions: [] });
  }

  const tier = computeTier(account.points, settings);
  if (tier !== account.tier) {
    await prisma.loyaltyAccount.update({ where: { id: account.id }, data: { tier } });
  }

  return res.ok({ ...account, tier, settings });
});

export const POST = withAuth(async (req, user, { params }: { params: { clientId: string } }) => {
  const body = await req.json();
  const { businessId, points, type = 'EARN', description, referenceId, referenceType } = body;
  if (!businessId || points === undefined) return res.badRequest('businessId and points are required');
  await requireBusinessAccess(user, businessId);

  const settings = await prisma.loyaltySettings.findUnique({ where: { businessId } });

  const account = await prisma.loyaltyAccount.upsert({
    where: { businessId_clientId: { businessId, clientId: params.clientId } },
    create: { businessId, clientId: params.clientId, points: 0, lifetimePoints: 0 },
    update: {},
  });

  const newPoints = Math.max(0, account.points + points);
  const newLifetime = type === 'EARN' ? account.lifetimePoints + points : account.lifetimePoints;
  const tier = computeTier(newPoints, settings);

  const [transaction] = await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        businessId,
        type,
        points,
        description,
        referenceId: referenceId || null,
        referenceType: referenceType || null,
      },
    }),
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newPoints, lifetimePoints: newLifetime, tier },
    }),
  ]);

  return res.ok({ transaction, points: newPoints, tier });
});
