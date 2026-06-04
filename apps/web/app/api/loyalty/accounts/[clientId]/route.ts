import { withAuth, requirePermission, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { computeTier, neverDecreaseTier } from '@/lib/loyalty';
import { sendLoyaltyTierUpgradeEmail } from '@/lib/email';

export const GET = withAuth(async (req, user, { params }: { params: { clientId: string } }) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requirePermission(user, businessId, 'loyalty:view');

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

  const computedTier = computeTier(account.lifetimePoints, settings);
  const tier = neverDecreaseTier(account.tier, computedTier);
  if (tier !== account.tier) {
    await prisma.loyaltyAccount.update({ where: { id: account.id }, data: { tier } });
  }

  return res.ok({ ...account, tier, settings });
});

export const POST = withAuth(async (req, user, { params }: { params: { clientId: string } }) => {
  const body = await req.json();
  const { businessId, points, type = 'EARN', description, referenceId, referenceType } = body;
  if (!businessId || points === undefined) return res.badRequest('businessId and points are required');
  await requirePermission(user, businessId, 'loyalty:manage');

  const [settings, business] = await Promise.all([
    prisma.loyaltySettings.findUnique({ where: { businessId } }),
    prisma.business.findUnique({ where: { id: businessId }, select: { name: true } }),
  ]);

  const account = await prisma.loyaltyAccount.upsert({
    where: { businessId_clientId: { businessId, clientId: params.clientId } },
    create: { businessId, clientId: params.clientId, points: 0, lifetimePoints: 0 },
    update: {},
    include: { client: { select: { email: true, firstName: true, lastName: true } } },
  });

  const previousTier = account.tier;
  const newPoints = Math.max(0, account.points + points);
  const newLifetime = type === 'EARN' && points > 0 ? account.lifetimePoints + points : account.lifetimePoints;
  const rawTier = computeTier(newLifetime, settings);
  const tier = neverDecreaseTier(previousTier, rawTier);

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

  // 7.1.3 — notify client when they reach a new tier
  if (tier !== previousTier && account.client.email) {
    const tierRank: Record<string, number> = { BRONZE: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };
    if ((tierRank[tier] ?? 0) > (tierRank[previousTier] ?? 0)) {
      const clientName = [account.client.firstName, account.client.lastName].filter(Boolean).join(' ');
      sendLoyaltyTierUpgradeEmail({
        to: account.client.email,
        clientName,
        businessName: business?.name ?? 'your practice',
        newTier: tier,
        points: newPoints,
      }).catch(() => {});
    }
  }

  return res.ok({ transaction, points: newPoints, tier });
});
