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

    const packagePurchase = await prisma.packagePurchase.findFirst({
      where: { id, businessId },
      include: {
        client: true,
        packageSessions: {
          orderBy: { redeemedAt: 'desc' },
          include: { appointment: true },
        },
      },
    });

    if (!packagePurchase) return res.notFound('Package not found');

    return res.ok(packagePurchase);
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

    const existing = await prisma.packagePurchase.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Package not found');

    const updatedPackage = await prisma.packagePurchase.update({
      where: { id },
      data: {
        ...data,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
      },
      include: {
        client: true,
        packageSessions: {
          take: 5,
          orderBy: { redeemedAt: 'desc' },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'PACKAGE_UPDATED',
        entityType: 'PackagePurchase',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return res.ok(updatedPackage);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
