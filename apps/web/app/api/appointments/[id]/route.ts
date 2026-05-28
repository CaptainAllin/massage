import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { checkAvailability } from '@/lib/check-availability';
import { emitWebhookEvent } from '@/lib/webhooks';
import { emitAutomation } from '@/lib/automation';

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
    const { businessId, startTime, duration, therapistId, recurringScope, ...rest } = body;
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

    // Propagate non-time fields to other appointments in the series if scope requested
    if (existing.recurringSeriesId && recurringScope && recurringScope !== 'this_only') {
      const bulkData: any = {};
      if (rest.serviceType !== undefined) bulkData.serviceType = rest.serviceType;
      if (rest.price !== undefined) bulkData.price = rest.price;
      if (rest.notes !== undefined) bulkData.notes = rest.notes;
      if (therapistId) bulkData.therapistId = therapistId;
      if (duration) bulkData.duration = parseInt(duration);

      if (Object.keys(bulkData).length > 0) {
        const futureWhere: any = {
          recurringSeriesId: existing.recurringSeriesId,
          id: { not: id },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        };
        if (recurringScope === 'this_and_following') {
          futureWhere.startTime = { gte: existing.startTime };
        }
        await prisma.appointment.updateMany({ where: futureWhere, data: bulkData });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id, businessId, action: 'APPOINTMENT_UPDATED',
        entityType: 'Appointment', entityId: id,
        metadata: { updatedFields: Object.keys(body), recurringScope },
      },
    });

    const isCancelled = updated.status === 'CANCELLED' && existing.status !== 'CANCELLED';
    const isCompleted = updated.status === 'COMPLETED' && existing.status !== 'COMPLETED';
    const event = isCancelled ? 'appointment.cancelled' : 'appointment.updated';
    emitWebhookEvent(businessId, event, { id, status: updated.status, clientId: updated.clientId, therapistId: updated.therapistId }).catch(() => {});

    const automationPayload = {
      appointmentId: id,
      clientId: updated.clientId,
      therapistId: updated.therapistId,
      serviceType: (updated as any).serviceType ?? null,
      startTime: updated.startTime.toISOString(),
      businessId,
    };
    if (isCancelled) emitAutomation('APPOINTMENT_CANCELLED', businessId, automationPayload);
    if (isCompleted) emitAutomation('APPOINTMENT_COMPLETED', businessId, automationPayload);

    return res.ok(updated, 'Appointment updated successfully');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
