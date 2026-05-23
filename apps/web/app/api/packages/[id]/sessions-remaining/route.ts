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
    });

    if (!packagePurchase) return res.notFound('Package not found');

    const remaining = Math.max(0, packagePurchase.totalSessions - packagePurchase.sessionsUsed);

    return res.ok({
      total: packagePurchase.totalSessions,
      used: packagePurchase.sessionsUsed,
      remaining,
      expirationDate: packagePurchase.expirationDate,
      isExpired: packagePurchase.expirationDate
        ? new Date() > packagePurchase.expirationDate
        : false,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
