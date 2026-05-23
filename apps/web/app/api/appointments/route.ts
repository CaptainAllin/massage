import { NextRequest } from 'next/server';
import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus } from '@prisma/client';

export const GET = withAuth(async (req, _user) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const status = searchParams.get('status');
  const therapistId = searchParams.get('therapistId');
  const clientId = searchParams.get('clientId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const sortBy = searchParams.get('sortBy') || 'startTime';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  const where: any = { businessId };

  if (status) {
    const statuses = status.split(',');
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }
  if (therapistId) where.therapistId = therapistId;
  if (clientId) where.clientId = clientId;
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(endDate);
  }

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: {
        client: true,
        therapist: { include: { user: true } },
        cancellation: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return Response.json({
    success: true,
    data: appointments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, clientId, therapistId, startTime, duration, ...rest } = body;

  if (!businessId || !clientId || !therapistId || !startTime || !duration) {
    return res.badRequest('Missing required fields: businessId, clientId, therapistId, startTime, duration');
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60000);

  const availability = await checkAvailability(therapistId, start, end);
  if (!availability.available) {
    return res.badRequest(availability.message || 'Appointment slot not available');
  }

  const appointment = await prisma.appointment.create({
    data: {
      businessId,
      clientId,
      therapistId,
      startTime: start,
      endTime: end,
      duration,
      status: AppointmentStatus.SCHEDULED,
      ...rest,
    },
    include: {
      client: true,
      therapist: { include: { user: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      businessId,
      action: 'APPOINTMENT_CREATED',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: { clientId, therapistId, startTime: start, duration },
    },
  });

  return res.created(appointment, 'Appointment created successfully');
});

export async function checkAvailability(
  therapistId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
) {
  const dayOfWeek = startTime.getDay();
  const timeString = startTime.toTimeString().substring(0, 5);
  const endTimeString = endTime.toTimeString().substring(0, 5);

  const availability = await prisma.therapistAvailability.findFirst({
    where: { therapistId, dayOfWeek, isActive: true },
  });

  if (!availability) {
    return { available: false, reason: 'NO_AVAILABILITY', message: 'Therapist has no availability set for this day' };
  }

  if (timeString < availability.startTime || endTimeString > availability.endTime) {
    return {
      available: false,
      reason: 'OUTSIDE_HOURS',
      message: `Therapist works ${availability.startTime} - ${availability.endTime} on this day`,
    };
  }

  const timeOff = await prisma.therapistTimeOff.findFirst({
    where: {
      therapistId,
      OR: [
        { AND: [{ startDate: { lte: startTime } }, { endDate: { gte: startTime } }] },
        { AND: [{ startDate: { lte: endTime } }, { endDate: { gte: endTime } }] },
        { AND: [{ startDate: { gte: startTime } }, { endDate: { lte: endTime } }] },
      ],
    },
  });

  if (timeOff) {
    return { available: false, reason: 'TIME_OFF', message: 'Therapist is on time off during this period' };
  }

  const conflictWhere: any = {
    therapistId,
    status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
    OR: [
      { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
      { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
      { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
    ],
  };
  if (excludeAppointmentId) conflictWhere.id = { not: excludeAppointmentId };

  const conflicts = await prisma.appointment.findMany({
    where: conflictWhere,
    include: { client: true },
  });

  if (conflicts.length > 0) {
    return {
      available: false,
      reason: 'CONFLICT',
      conflicts,
      message: `Therapist has ${conflicts.length} conflicting appointment(s)`,
    };
  }

  return { available: true };
}
