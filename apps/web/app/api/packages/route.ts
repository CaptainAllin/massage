import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const expiringSoon = searchParams.get('expiringSoon') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = { businessId };
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expirationDate = { lte: thirtyDaysFromNow, gte: new Date() };
      where.status = 'ACTIVE';
    }

    const [packages, total] = await Promise.all([
      prisma.packagePurchase.findMany({
        where,
        include: {
          client: true,
          packageSessions: {
            take: 5,
            orderBy: { redeemedAt: 'desc' },
            include: { appointment: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.packagePurchase.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: packages,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, clientId, name, description, totalSessions, totalPrice, currency, expirationDate } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!clientId) return res.badRequest('clientId is required');
    if (!name) return res.badRequest('name is required');
    if (totalSessions === undefined) return res.badRequest('totalSessions is required');
    if (totalPrice === undefined) return res.badRequest('totalPrice is required');

    const packagePurchase = await prisma.packagePurchase.create({
      data: {
        businessId,
        clientId,
        name,
        description,
        totalSessions,
        sessionsUsed: 0,
        totalPrice,
        currency: currency || (await prisma.business.findUnique({ where: { id: businessId }, select: { currency: true } }))?.currency || 'AUD',
        status: 'ACTIVE',
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
      include: { client: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'PACKAGE_PURCHASED',
        entityType: 'PackagePurchase',
        entityId: packagePurchase.id,
        metadata: { totalSessions, totalPrice },
      },
    });

    return res.created(packagePurchase);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
