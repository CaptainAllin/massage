import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const isActiveParam = searchParams.get('isActive');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = { businessId };

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true';
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: clients,
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
    const { businessId, ...data } = body;

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const client = await prisma.client.create({
      data: { ...data, businessId },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'CLIENT_CREATED',
        entityType: 'Client',
        entityId: client.id,
      },
    });

    return res.created(client);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
