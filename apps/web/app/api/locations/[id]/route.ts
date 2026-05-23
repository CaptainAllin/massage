import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (_req, user, { params }: { params: { id: string } }) => {
  const location = await prisma.location.findUnique({ where: { id: params.id } });
  if (!location) return res.notFound('Location not found');
  await requireBusinessAccess(user, location.businessId);
  return res.ok(location);
});

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const location = await prisma.location.findUnique({ where: { id: params.id } });
  if (!location) return res.notFound('Location not found');
  await requireBusinessAccess(user, location.businessId);

  const body = await req.json();
  const { businessId: _biz, ...updates } = body;

  if (updates.isPrimary) {
    await prisma.location.updateMany({
      where: { businessId: location.businessId },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.location.update({ where: { id: params.id }, data: updates });
  return res.ok(updated);
});

export const DELETE = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const location = await prisma.location.findUnique({ where: { id: params.id } });
  if (!location) return res.notFound('Location not found');
  await requireBusinessAccess(user, location.businessId);

  await prisma.location.delete({ where: { id: params.id } });

  await logAudit(req, {
    userId: user.id,
    businessId: location.businessId,
    action: 'LOCATION_DELETED',
    entityType: 'Location',
    entityId: params.id,
    metadata: { name: location.name },
  });

  return res.ok({ success: true });
});
