import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { GroupBookingStatus } from '@prisma/client';

// GET — list all group bookings (attendees) for a group appointment
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const appointment = await prisma.appointment.findFirst({
      where: { id: params.id, businessId },
    });
    if (!appointment) return res.notFound('Appointment not found');
    if (!appointment.isGroup) return res.badRequest('Appointment is not a group session');

    const groupBookings = await prisma.groupBooking.findMany({
      where: { appointmentId: params.id },
      include: { client: true },
      orderBy: { createdAt: 'asc' },
    });

    return res.ok(groupBookings);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

// POST — add a client to a group appointment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, clientId } = body;

    if (!businessId || !clientId) return res.badRequest('businessId and clientId are required');

    const appointment = await prisma.appointment.findFirst({
      where: { id: params.id, businessId },
      include: { groupBookings: true },
    });
    if (!appointment) return res.notFound('Appointment not found');
    if (!appointment.isGroup) return res.badRequest('Appointment is not a group session');

    const activeBookings = appointment.groupBookings.filter(
      (b) => b.status !== GroupBookingStatus.CANCELLED
    ).length;

    if (appointment.capacity && activeBookings >= appointment.capacity) {
      return res.badRequest('Group session is at full capacity');
    }

    const existing = await prisma.groupBooking.findUnique({
      where: { appointmentId_clientId: { appointmentId: params.id, clientId } },
    });
    if (existing && existing.status !== GroupBookingStatus.CANCELLED) {
      return res.badRequest('Client is already booked in this session');
    }

    const client = await prisma.client.findFirst({ where: { id: clientId, businessId } });
    if (!client) return res.notFound('Client not found');

    const booking = existing
      ? await prisma.groupBooking.update({
          where: { id: existing.id },
          data: { status: GroupBookingStatus.REGISTERED },
          include: { client: true },
        })
      : await prisma.groupBooking.create({
          data: { appointmentId: params.id, clientId, status: GroupBookingStatus.REGISTERED },
          include: { client: true },
        });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'GROUP_BOOKING_ADDED',
        entityType: 'GroupBooking',
        entityId: booking.id,
        metadata: { appointmentId: params.id, clientId },
      },
    });

    return res.created(booking, 'Client added to group session');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
