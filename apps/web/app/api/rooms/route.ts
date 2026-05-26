import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const isActive = searchParams.get('isActive');

  if (!businessId) return res.badRequest('businessId is required');

  const where: any = { businessId };
  if (isActive !== null) where.isActive = isActive === 'true';

  const rooms = await prisma.room.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return res.ok(rooms);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, name, color, capacity } = body;

  if (!businessId || !name) return res.badRequest('businessId and name are required');

  const room = await prisma.room.create({
    data: {
      businessId,
      name,
      color: color || '#8B5CF6',
      capacity: capacity ? parseInt(capacity) : 1,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, businessId, action: 'CREATE', entityType: 'Room', entityId: room.id },
  });

  return res.created(room);
});
