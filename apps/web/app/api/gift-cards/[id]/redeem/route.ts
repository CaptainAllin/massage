import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const { amount, invoiceId, paymentId } = body;
  if (!amount || amount <= 0) return res.badRequest('amount must be positive');

  const giftCard = await prisma.giftCard.findUnique({ where: { id: params.id } });
  if (!giftCard) return res.notFound('Gift card not found');
  await requireBusinessAccess(user, giftCard.businessId);

  if (!giftCard.isActive) return res.badRequest('Gift card is inactive');
  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) return res.badRequest('Gift card has expired');
  if (giftCard.balance < amount) return res.badRequest(`Insufficient balance. Available: $${giftCard.balance.toFixed(2)}`);

  const [redemption] = await prisma.$transaction([
    prisma.giftCardRedemption.create({
      data: {
        giftCardId: params.id,
        businessId: giftCard.businessId,
        amount,
        invoiceId: invoiceId || null,
        paymentId: paymentId || null,
      },
    }),
    prisma.giftCard.update({
      where: { id: params.id },
      data: {
        balance: { decrement: amount },
        isActive: giftCard.balance - amount > 0,
      },
    }),
  ]);

  await logAudit(req, {
    userId: user.id,
    businessId: giftCard.businessId,
    action: 'GIFT_CARD_REDEEMED',
    entityType: 'GiftCard',
    entityId: params.id,
    metadata: { amount, remainingBalance: giftCard.balance - amount },
  });

  return res.ok({ redemption, remainingBalance: giftCard.balance - amount });
});
