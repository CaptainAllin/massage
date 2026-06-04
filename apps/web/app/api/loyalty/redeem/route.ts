import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// POST /api/loyalty/redeem — redeem points for a client (min 100 pts)
export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, clientId, points, description } = body;

  if (!businessId || !clientId || !points || points <= 0) {
    return res.badRequest('businessId, clientId, and positive points are required');
  }
  if (points < 100) return res.badRequest('Minimum redemption is 100 points');

  await requireBusinessAccess(user, businessId);

  const [account, settings] = await Promise.all([
    prisma.loyaltyAccount.findUnique({
      where: { businessId_clientId: { businessId, clientId } },
    }),
    prisma.loyaltySettings.findUnique({ where: { businessId } }),
  ]);

  if (!account) return res.notFound('Loyalty account not found');
  if (account.points < points) {
    return res.badRequest(`Insufficient points. Available: ${account.points}`);
  }

  const dollarValue = settings ? points * settings.dollarPerPoint : 0;
  const newPoints = account.points - points;

  await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        businessId,
        type: 'REDEEM',
        points: -points,
        description: description || `Redeemed ${points} points ($${dollarValue.toFixed(2)} discount)`,
      },
    }),
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { points: newPoints },
    }),
  ]);

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'LOYALTY_REDEEMED',
    entityType: 'LoyaltyAccount',
    entityId: account.id,
    metadata: { points, dollarValue, clientId },
  });

  return res.ok({ pointsRedeemed: points, dollarValue, remainingPoints: newPoints });
});
