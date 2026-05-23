import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const where: any = { businessId };
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');
  if (clientId) where.clientId = clientId;
  if (status) where.status = status;

  const memberships = await prisma.membership.findMany({
    where,
    include: { client: true, membershipSessions: { orderBy: { redeemedAt: 'desc' }, take: 5 } },
    orderBy: { createdAt: 'desc' },
  });

  return res.ok(memberships);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, clientId, name, sessionsPerMonth, pricePerMonth, startDate, ...rest } = body;

  if (!businessId || !clientId) return res.badRequest('businessId and clientId are required');

  const membership = await prisma.membership.create({
    data: { businessId, clientId, name, sessionsPerMonth, pricePerMonth, startDate: startDate ? new Date(startDate) : new Date(), status: 'ACTIVE', ...rest },
    include: { client: true },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, businessId, action: 'MEMBERSHIP_CREATED', entityType: 'Membership', entityId: membership.id },
  });

  return res.created(membership);
});
