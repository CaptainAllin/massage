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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { hubspotAccessToken: true } as any,
    });

    return res.ok({ connected: !!(business as any)?.hubspotAccessToken });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[hubspot/status]', err);
    return res.error();
  }
}
