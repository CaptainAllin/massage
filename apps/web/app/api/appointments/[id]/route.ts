import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { checkAvailability } from '@/lib/check-availability';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const appointment = await prisma.appointment.findFirst({
      where: { id: params.id, businessId },
      include: {
        client: true,
        therapist: { include: { user: true } },
        cancellation: true,
        groupBookings: { include: { client: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!appointment) return res.notFound('Appointment not found');
    return res.ok(appointment);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const id = params.id;
    const body = await req.json();
    const { businessId, startTime, duration, therapistId, ...rest } = body;
    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.appointment.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Appointment not found');

    let updateData: any = { ...rest };

    if (startTime || duration) {
      const start = new Date(startTime || existing.startTime);
      const dur = duration || existing.duration;
      const end = new Date(start.getTime() + dur * 60000);
      const therapist = therapistId || existing.therapistId;

      const availability = await checkAvailability(therapist, start, end, id);
      if (!availability.available) return res.badRequest(availability.message || 'Slot not available');

      updateData = { ...updateData, startTime: start, endTime: end, duration: dur };
    }
    if (therapistId) updateData.therapistId = therapistId;

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { client: true, therapist: { include: { user: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id, businessId, action: 'APPOINTMENT_UPDATED',
        entityType: 'Appointment', entityId: id,
        metadata: { updatedFields: Object.keys(body) },
      },
    });

    return res.ok(updated, 'Appointment updated successfully');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
