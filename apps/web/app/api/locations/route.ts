import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const locations = await prisma.location.findMany({
    where: { businessId },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
  });

  return res.ok(locations);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, name, ...rest } = body;
  if (!businessId || !name) return res.badRequest('businessId and name are required');
  await requireBusinessAccess(user, businessId);

  if (rest.isPrimary) {
    await prisma.location.updateMany({ where: { businessId }, data: { isPrimary: false } });
  }

  const location = await prisma.location.create({ data: { businessId, name, ...rest } });

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'LOCATION_CREATED',
    entityType: 'Location',
    entityId: location.id,
    metadata: { name },
  });

  return res.created(location);
});
