import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const provider = await prisma.insuranceProvider.findUnique({ where: { id: params.id } });
  if (!provider) return res.notFound('Provider not found');
  await requireBusinessAccess(user, provider.businessId);
  return res.ok(provider);
});

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const provider = await prisma.insuranceProvider.findUnique({ where: { id: params.id } });
  if (!provider) return res.notFound('Provider not found');
  await requireBusinessAccess(user, provider.businessId);

  const body = await req.json();
  const updated = await prisma.insuranceProvider.update({
    where: { id: params.id },
    data: {
      name: body.name,
      payerId: body.payerId,
      address: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      phone: body.phone,
      fax: body.fax,
      portalUrl: body.portalUrl,
      claimsEmail: body.claimsEmail,
      notes: body.notes,
      isActive: body.isActive,
    },
  });

  return res.ok(updated);
});

export const DELETE = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const provider = await prisma.insuranceProvider.findUnique({ where: { id: params.id } });
  if (!provider) return res.notFound('Provider not found');
  await requireBusinessAccess(user, provider.businessId);

  await prisma.insuranceProvider.delete({ where: { id: params.id } });

  await logAudit(req, {
    userId: user.id,
    businessId: provider.businessId,
    action: 'INSURANCE_PROVIDER_DELETED',
    entityType: 'InsuranceProvider',
    entityId: params.id,
    metadata: { name: provider.name },
  });

  return res.ok({ success: true });
});
