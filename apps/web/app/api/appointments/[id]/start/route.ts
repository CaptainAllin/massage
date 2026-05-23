import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const appointment = await prisma.appointment.findFirst({ where: { id: params.id, businessId } });
    if (!appointment) return res.notFound('Appointment not found');
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      return res.badRequest('Only CONFIRMED appointments can be started');
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: AppointmentStatus.IN_PROGRESS },
      include: { client: true, therapist: { include: { user: true } } },
    });
    return res.ok(updated, 'Appointment started');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
