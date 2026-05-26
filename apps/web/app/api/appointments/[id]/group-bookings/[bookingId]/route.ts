import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { GroupBookingStatus } from '@prisma/client';

// PATCH — update a group booking status (attended / no-show / cancelled)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; bookingId: string } }
) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, status } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!status || !Object.values(GroupBookingStatus).includes(status)) {
      return res.badRequest('Valid status required: REGISTERED, ATTENDED, NO_SHOW, CANCELLED');
    }

    const booking = await prisma.groupBooking.findFirst({
      where: {
        id: params.bookingId,
        appointmentId: params.id,
        appointment: { businessId },
      },
      include: { client: true },
    });
    if (!booking) return res.notFound('Group booking not found');

    const updated = await prisma.groupBooking.update({
      where: { id: params.bookingId },
      data: { status },
      include: { client: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'GROUP_BOOKING_STATUS_UPDATED',
        entityType: 'GroupBooking',
        entityId: params.bookingId,
        metadata: { appointmentId: params.id, status, clientId: booking.clientId },
      },
    });

    return res.ok(updated, 'Group booking updated');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

// DELETE — remove a client from a group session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; bookingId: string } }
) {
  try {
    const user = await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const booking = await prisma.groupBooking.findFirst({
      where: {
        id: params.bookingId,
        appointmentId: params.id,
        appointment: { businessId },
      },
    });
    if (!booking) return res.notFound('Group booking not found');

    await prisma.groupBooking.update({
      where: { id: params.bookingId },
      data: { status: GroupBookingStatus.CANCELLED },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'GROUP_BOOKING_CANCELLED',
        entityType: 'GroupBooking',
        entityId: params.bookingId,
        metadata: { appointmentId: params.id, clientId: booking.clientId },
      },
    });

    return res.ok(null, 'Client removed from group session');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
