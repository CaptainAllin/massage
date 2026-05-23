import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const providers = await prisma.insuranceProvider.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
  });

  return res.ok({ providers });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, name, payerId, address, city, state, postalCode, phone, fax, portalUrl, claimsEmail, notes } = body;
  if (!businessId || !name) return res.badRequest('businessId and name are required');
  await requireBusinessAccess(user, businessId);

  const provider = await prisma.insuranceProvider.create({
    data: { businessId, name, payerId, address, city, state, postalCode, phone, fax, portalUrl, claimsEmail, notes },
  });

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'INSURANCE_PROVIDER_CREATED',
    entityType: 'InsuranceProvider',
    entityId: provider.id,
    metadata: { name },
  });

  return res.created(provider);
});
