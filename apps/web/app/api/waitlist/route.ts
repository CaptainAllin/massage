import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { WaitlistStatus } from '@prisma/client';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const status = searchParams.get('status') as WaitlistStatus | null;
  const therapistId = searchParams.get('therapistId');
  const serviceType = searchParams.get('serviceType');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const where: any = { businessId };
  if (status) where.status = status;
  if (therapistId) where.therapistId = therapistId;
  if (serviceType) where.serviceType = serviceType;

  const [total, entries] = await Promise.all([
    prisma.waitlist.count({ where }),
    prisma.waitlist.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
        therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return Response.json({
    success: true,
    data: entries,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, clientId, therapistId, serviceType, preferredDates, preferredTimes, notes } = body;

  if (!businessId || !clientId) {
    return res.badRequest('businessId and clientId are required');
  }

  const existing = await prisma.waitlist.findFirst({
    where: { businessId, clientId, status: WaitlistStatus.WAITING },
  });
  if (existing) return res.badRequest('Client already on waitlist');

  const entry = await prisma.waitlist.create({
    data: {
      businessId,
      clientId,
      therapistId: therapistId || null,
      serviceType: serviceType || null,
      preferredDates: preferredDates || [],
      preferredTimes: preferredTimes || [],
      notes: notes || null,
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
      therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      businessId,
      action: 'WAITLIST_ADDED',
      entityType: 'Waitlist',
      entityId: entry.id,
      metadata: { clientId, serviceType, therapistId },
    },
  });

  return res.created(entry, 'Added to waitlist');
});
