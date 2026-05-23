import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const settings = await prisma.loyaltySettings.findUnique({ where: { businessId } });
  return res.ok(settings);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, ...data } = body;
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const settings = await prisma.loyaltySettings.upsert({
    where: { businessId },
    create: { businessId, ...data },
    update: data,
  });

  return res.ok(settings);
});
