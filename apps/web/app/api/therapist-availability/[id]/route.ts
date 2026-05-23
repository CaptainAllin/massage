import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const availability = await prisma.therapistAvailability.findFirst({
      where: { id: params.id, businessId },
      include: { therapist: { include: { user: true } } },
    });
    if (!availability) return res.notFound('Availability not found');
    return res.ok(availability);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, ...data } = body;
    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.therapistAvailability.findFirst({ where: { id: params.id, businessId } });
    if (!existing) return res.notFound('Availability not found');

    const updated = await prisma.therapistAvailability.update({
      where: { id: params.id },
      data,
      include: { therapist: { include: { user: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id, businessId, action: 'AVAILABILITY_UPDATED',
        entityType: 'TherapistAvailability', entityId: params.id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.therapistAvailability.findFirst({ where: { id: params.id, businessId } });
    if (!existing) return res.notFound('Availability not found');

    await prisma.therapistAvailability.delete({ where: { id: params.id } });
    await prisma.auditLog.create({
      data: { userId: user.id, businessId, action: 'AVAILABILITY_DELETED', entityType: 'TherapistAvailability', entityId: params.id },
    });

    return res.ok({ id: params.id }, 'Availability deleted');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
