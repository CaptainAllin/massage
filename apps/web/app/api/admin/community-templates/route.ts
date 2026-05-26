import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Admin: list community templates by status
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BUSINESS_OWNER') {
      return res.forbidden('Admin access required');
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'PENDING';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

    const where: any = status === 'ALL' ? {} : { status };

    const [templates, total] = await Promise.all([
      prisma.communityTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityTemplate.count({ where }),
    ]);

    return res.ok({ templates, total, page, limit });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
