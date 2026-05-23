import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const id = params.id;
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const body = await req.json().catch(() => ({}));
    const { reason, cancellationType } = body;

    const appointment = await prisma.appointment.findFirst({ where: { id, businessId } });
    if (!appointment) return res.notFound('Appointment not found');
    if (appointment.status === AppointmentStatus.CANCELLED) return res.badRequest('Already cancelled');

    const [updated] = await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
        include: { client: true, therapist: { include: { user: true } } },
      }),
      prisma.appointmentCancellation.create({
        data: {
          appointmentId: id, businessId,
          cancelledBy: user.id,
          reason: reason || null,
          cancellationType: cancellationType || 'CLIENT_REQUESTED',
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id, businessId,
          action: 'APPOINTMENT_CANCELLED', entityType: 'Appointment', entityId: id,
          metadata: { reason, type: cancellationType },
        },
      }),
    ]);

    return res.ok(updated, 'Appointment cancelled');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
