import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!business) return res.notFound('Business not found');

    // Check access permissions
    if (user.role !== 'SUPER_ADMIN' && business.ownerId !== user.id) {
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { therapist: true },
      });
      if (!(fullUser as any)?.therapist || (fullUser as any).therapist.businessId !== id) {
        return res.forbidden('Access denied');
      }
    }

    return res.ok(business);
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
    const data = await req.json();

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) return res.notFound('Business not found');

    if (user.role !== 'SUPER_ADMIN' && business.ownerId !== user.id) {
      return res.forbidden('Only the business owner can update business information');
    }

    const { id: _id, ownerId, ...safeData } = data;

    const updated = await prisma.business.update({
      where: { id },
      data: safeData as any,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId: id,
        action: 'BUSINESS_UPDATED',
        entityType: 'Business',
        entityId: id,
        metadata: { updatedFields: Object.keys(safeData) },
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
