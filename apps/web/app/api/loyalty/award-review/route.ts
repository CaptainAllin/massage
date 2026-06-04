import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { computeTier, neverDecreaseTier } from '@/lib/loyalty';

// POST /api/loyalty/award-review — owner marks a review as received and awards points
export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, clientId, reviewId } = body;

  if (!businessId || !clientId) return res.badRequest('businessId and clientId are required');
  await requireBusinessAccess(user, businessId);

  const settings = await prisma.loyaltySettings.findUnique({ where: { businessId } });
  if (!settings?.isActive) return res.badRequest('Loyalty program is not active');

  const points = settings.reviewBonusPoints ?? 50;

  const account = await prisma.loyaltyAccount.upsert({
    where: { businessId_clientId: { businessId, clientId } },
    create: { businessId, clientId, points: 0, lifetimePoints: 0 },
    update: {},
  });

  // Check if review points already awarded for this review
  if (reviewId) {
    const existing = await prisma.loyaltyTransaction.findFirst({
      where: { loyaltyAccountId: account.id, referenceId: reviewId, referenceType: 'Review' },
    });
    if (existing) return res.badRequest('Review points already awarded');
  }

  const newPoints = account.points + points;
  const newLifetime = account.lifetimePoints + points;
  const rawTier = computeTier(newLifetime, settings);
  const tier = neverDecreaseTier(account.tier, rawTier);

  await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        businessId,
        type: 'EARN',
        points,
        description: 'Review submitted',
        referenceId: reviewId || null,
        referenceType: reviewId ? 'Review' : null,
      },
    }),
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newPoints, lifetimePoints: newLifetime, tier },
    }),
  ]);

  return res.ok({ pointsAwarded: points, remainingPoints: newPoints, tier });
});
