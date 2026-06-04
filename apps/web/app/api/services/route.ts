import { withAuth, requireBusinessAccess, res, logAudit } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');
  await requireBusinessAccess(user, businessId);

  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: 'asc' },
  });

  return res.ok(services);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, name, duration, price, ...rest } = body;
  if (!businessId || !name || !duration || price == null) {
    return res.badRequest('businessId, name, duration, and price are required');
  }
  await requireBusinessAccess(user, businessId);

  const service = await prisma.service.create({
    data: { businessId, name, duration: parseInt(duration), price: parseFloat(price), ...rest },
  });

  await logAudit(req, {
    userId: user.id,
    businessId,
    action: 'SERVICE_CREATED',
    entityType: 'Service',
    entityId: service.id,
    metadata: { name },
  });

  return res.created(service);
});
