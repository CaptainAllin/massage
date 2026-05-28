import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { businessId } = await req.json();
    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    await prisma.business.update({
      where: { id: businessId },
      data: { slackAccessToken: null, slackDefaultChannel: null },
    });

    return res.ok({ disconnected: true });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[slack/disconnect]', err);
    return res.error();
  }
}
