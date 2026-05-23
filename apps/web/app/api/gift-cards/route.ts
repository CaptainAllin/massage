import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

function generateGiftCardCode(): string {
  return randomBytes(4).toString('hex').toUpperCase().replace(/(.{4})/g, '$1-').slice(0, -1);
}

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const where: any = { businessId };
  const isActive = searchParams.get('isActive');
  const code = searchParams.get('code');
  if (isActive !== null) where.isActive = isActive === 'true';
  if (code) where.code = code;

  const giftCards = await prisma.giftCard.findMany({
    where,
    include: { purchasedBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok(giftCards);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, amount, recipientEmail, recipientName, note, expiresAt, purchasedById } = body;
  if (!businessId || !amount) return res.badRequest('businessId and amount are required');
  await requireBusinessAccess(user, businessId);

  let code: string;
  let attempts = 0;
  do {
    code = generateGiftCardCode();
    attempts++;
    if (attempts > 10) return res.error('Could not generate unique gift card code');
  } while (await prisma.giftCard.findUnique({ where: { code } }));

  const giftCard = await prisma.giftCard.create({
    data: {
      businessId,
      code,
      originalAmount: amount,
      balance: amount,
      recipientEmail,
      recipientName,
      note,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      purchasedById: purchasedById || null,
    },
    include: { purchasedBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'GIFT_CARD_CREATED',
    entityType: 'GiftCard',
    entityId: giftCard.id,
    metadata: { amount, code, recipientEmail },
  });

  return res.created(giftCard);
});
