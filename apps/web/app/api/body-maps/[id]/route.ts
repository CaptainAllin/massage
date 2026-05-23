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

    const bodyMap = await prisma.bodyMap.findFirst({
      where: { id, businessId },
      include: { client: true, appointment: true, treatmentNote: true },
    });

    if (!bodyMap) return res.notFound('Body map not found');

    return res.ok(bodyMap);
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

    const existing = await prisma.bodyMap.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Body map not found');

    const bodyMap = await prisma.bodyMap.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'BODY_MAP_UPDATED',
        entityType: 'BodyMap',
        entityId: id,
      },
    });

    return res.ok(bodyMap);
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

    const existing = await prisma.bodyMap.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Body map not found');

    const bodyMap = await prisma.bodyMap.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'BODY_MAP_DELETED',
        entityType: 'BodyMap',
        entityId: id,
      },
    });

    return res.ok(bodyMap);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
