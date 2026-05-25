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

    // Return filter counts for the filter chips
    if (searchParams.get('counts') === 'true') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [all, vip, newThisMonth, dueForVisit, inactive60d] = await Promise.all([
        prisma.client.count({ where: { businessId } }),
        prisma.client.count({ where: { businessId, totalVisits: { gte: 10 } } }),
        prisma.client.count({ where: { businessId, createdAt: { gte: startOfMonth } } }),
        prisma.client.count({
          where: {
            businessId,
            isActive: true,
            OR: [{ lastVisitDate: { lt: thirtyDaysAgo } }, { lastVisitDate: null }],
          },
        }),
        prisma.client.count({
          where: {
            businessId,
            OR: [{ isActive: false }, { lastVisitDate: { lt: sixtyDaysAgo } }],
          },
        }),
      ]);

      return Response.json({ success: true, data: { all, vip, newThisMonth, dueForVisit, inactive60d } });
    }

    const isActiveParam = searchParams.get('isActive');
    const search = searchParams.get('search');
    const filter = searchParams.get('filter');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const where: any = { businessId };

    if (filter === 'vip') {
      where.totalVisits = { gte: 10 };
    } else if (filter === 'new') {
      where.createdAt = { gte: startOfMonth };
    } else if (filter === 'due') {
      where.isActive = true;
      where.OR = [{ lastVisitDate: { lt: thirtyDaysAgo } }, { lastVisitDate: null }];
    } else if (filter === 'inactive') {
      where.OR = [{ isActive: false }, { lastVisitDate: { lt: sixtyDaysAgo } }];
    } else if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true';
    }

    if (search) {
      const searchCondition = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
      where.AND = [{ OR: searchCondition }];
      delete where.OR;
    }

    const skip = (page - 1) * limit;
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          preferredTherapist: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
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
