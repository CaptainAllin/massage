import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const provider = searchParams.get('provider');
    const status = searchParams.get('status');
    const entityType = searchParams.get('entityType');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const where: any = { businessId };
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (provider) {
      where.integration = { provider };
    }

    const [logs, total] = await Promise.all([
      prisma.accountingSyncLog.findMany({
        where,
        include: {
          integration: { select: { provider: true, tenantName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.accountingSyncLog.count({ where }),
    ]);

    return res.ok({ logs, total, page, limit });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[sync-logs/GET]', err);
    return res.error();
  }
}
