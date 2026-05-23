import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const giftCard = await prisma.giftCard.findUnique({
    where: { id: params.id },
    include: {
      purchasedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      redemptions: { orderBy: { redeemedAt: 'desc' } },
    },
  });
  if (!giftCard) return res.notFound('Gift card not found');
  await requireBusinessAccess(user, giftCard.businessId);
  return res.ok(giftCard);
});

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const giftCard = await prisma.giftCard.findUnique({ where: { id: params.id } });
  if (!giftCard) return res.notFound('Gift card not found');
  await requireBusinessAccess(user, giftCard.businessId);

  const body = await req.json();
  const { businessId: _biz, code: _code, ...updates } = body;

  const updated = await prisma.giftCard.update({ where: { id: params.id }, data: updates });
  return res.ok(updated);
});

export const DELETE = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const giftCard = await prisma.giftCard.findUnique({ where: { id: params.id } });
  if (!giftCard) return res.notFound('Gift card not found');
  await requireBusinessAccess(user, giftCard.businessId);

  await prisma.giftCard.update({ where: { id: params.id }, data: { isActive: false } });
  return res.ok({ success: true });
});
