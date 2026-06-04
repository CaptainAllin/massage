import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const where: any = {};

  const businessId = searchParams.get('businessId');
  const therapistId = searchParams.get('therapistId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status'); // PENDING | APPROVED | DECLINED

  if (businessId) where.businessId = businessId;
  if (therapistId) where.therapistId = therapistId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.OR = [];
    if (startDate) where.OR.push({ endDate: { gte: new Date(startDate) } });
    if (endDate) where.OR.push({ startDate: { lte: new Date(endDate) } });
  }

  const timeOff = await prisma.therapistTimeOff.findMany({
    where,
    include: { therapist: { include: { user: true } } },
    orderBy: { startDate: 'asc' },
  });

  return res.ok(timeOff);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const {
    businessId, therapistId, startDate, endDate, reason, isAllDay = true,
    leaveType = 'PERSONAL', submittedAsRequest = false, notes,
  } = body;

  if (!businessId || !therapistId || !startDate || !endDate) {
    return res.badRequest('businessId, therapistId, startDate, endDate are required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) return res.badRequest('startDate must be before endDate');

  // Owners/Senior Therapists create approved leave directly; staff submit requests (PENDING)
  const [isOwner, memberRole] = await Promise.all([
    prisma.business.findFirst({ where: { id: businessId, ownerId: user.id }, select: { id: true } }),
    prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
      select: { role: true },
    }),
  ]);
  const isManager = isOwner || memberRole?.role === 'SENIOR_THERAPIST';
  const status = (submittedAsRequest && !isManager) ? 'PENDING' : 'APPROVED';

  const timeOff = await prisma.therapistTimeOff.create({
    data: {
      businessId, therapistId, startDate: start, endDate: end, reason, isAllDay,
      leaveType, status, notes: notes || null,
      ...(status === 'APPROVED' && { approvedById: user.id, approvedAt: new Date() }),
    },
    include: { therapist: { include: { user: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      businessId,
      action: status === 'PENDING' ? 'LEAVE_REQUEST_SUBMITTED' : 'TIME_OFF_CREATED',
      entityType: 'TherapistTimeOff',
      entityId: timeOff.id,
      metadata: { therapistId, startDate: start, endDate: end, leaveType, status },
    },
  });

  return res.created(timeOff);
});
