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

    const integrations = await prisma.accountingIntegration.findMany({
      where: { businessId },
      select: {
        id: true,
        provider: true,
        status: true,
        tenantName: true,
        lastSyncAt: true,
        syncEnabled: true,
        createdAt: true,
      },
    });

    return res.ok(integrations);
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[integrations/GET]', err);
    return res.error();
  }
}
