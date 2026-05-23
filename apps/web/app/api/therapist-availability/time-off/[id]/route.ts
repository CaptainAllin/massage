import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const timeOff = await prisma.therapistTimeOff.findFirst({ where: { id: params.id, businessId } });
    if (!timeOff) return res.notFound('Time off not found');

    await prisma.therapistTimeOff.delete({ where: { id: params.id } });
    await prisma.auditLog.create({
      data: { userId: user.id, businessId, action: 'TIME_OFF_DELETED', entityType: 'TherapistTimeOff', entityId: params.id },
    });

    return res.ok({ id: params.id }, 'Time off deleted');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
