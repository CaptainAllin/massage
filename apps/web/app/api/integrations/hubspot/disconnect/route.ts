import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId } = body;
    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    await prisma.business.update({
      where: { id: businessId },
      data: { hubspotAccessToken: null } as any,
    });

    return res.ok({ disconnected: true });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[hubspot/disconnect]', err);
    return res.error();
  }
}
