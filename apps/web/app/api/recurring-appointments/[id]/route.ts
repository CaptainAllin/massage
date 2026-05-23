import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const series = await prisma.recurringAppointmentSeries.findFirst({
      where: { id, businessId },
      include: {
        client: true,
        therapist: { include: { user: true } },
        appointments: { orderBy: { startTime: 'asc' } },
      },
    });

    if (!series) return res.notFound('Recurring series not found');

    return res.ok(series);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, ...data } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.recurringAppointmentSeries.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Recurring series not found');

    const updated = await prisma.recurringAppointmentSeries.update({
      where: { id },
      data,
      include: {
        client: true,
        therapist: { include: { user: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'RECURRING_SERIES_UPDATED',
        entityType: 'RecurringAppointmentSeries',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.recurringAppointmentSeries.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Recurring series not found');

    // Deactivate instead of delete
    const series = await prisma.recurringAppointmentSeries.update({
      where: { id },
      data: { isActive: false },
    });

    // Cancel all future appointments
    await prisma.appointment.updateMany({
      where: {
        recurringSeriesId: id,
        startTime: { gte: new Date() },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      data: { status: 'CANCELLED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'RECURRING_SERIES_DELETED',
        entityType: 'RecurringAppointmentSeries',
        entityId: id,
      },
    });

    return res.ok(series);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
