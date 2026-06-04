import { withAuth, requirePermission, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req, user, { params }: { params: { clientId: string } }) => {
  const body = await req.json();
  const { businessId, points, description } = body;
  if (!businessId || !points || points <= 0) return res.badRequest('businessId and positive points are required');
  if (points < 100) return res.badRequest('Minimum redemption is 100 points');
  await requirePermission(user, businessId, 'loyalty:manage');

  const [account, settings] = await Promise.all([
    prisma.loyaltyAccount.findUnique({
      where: { businessId_clientId: { businessId, clientId: params.clientId } },
    }),
    prisma.loyaltySettings.findUnique({ where: { businessId } }),
  ]);

  if (!account) return res.notFound('Loyalty account not found');
  if (account.points < points) return res.badRequest(`Insufficient points. Available: ${account.points}`);

  const dollarValue = settings ? points * settings.dollarPerPoint : 0;
  const newPoints = account.points - points;

  await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        businessId,
        type: 'REDEEM',
        points: -points,
        description: description || `Redeemed ${points} points ($${dollarValue.toFixed(2)})`,
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
    metadata: { points, dollarValue, clientId: params.clientId },
  });

  return res.ok({ pointsRedeemed: points, dollarValue, remainingPoints: newPoints });
});
