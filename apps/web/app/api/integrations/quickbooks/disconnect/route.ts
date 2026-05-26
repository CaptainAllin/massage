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

    const integration = await prisma.accountingIntegration.findUnique({
      where: { businessId_provider: { businessId, provider: 'QUICKBOOKS' } },
    });

    if (!integration) return res.notFound('QuickBooks integration not found');

    if (integration.refreshToken) {
      try {
        const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
        const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
        await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({ token: integration.refreshToken }),
        });
      } catch {
        // Non-fatal
      }
    }

    await prisma.accountingIntegration.update({
      where: { businessId_provider: { businessId, provider: 'QUICKBOOKS' } },
      data: {
        status: 'DISCONNECTED',
        accessToken: null,
        refreshToken: null,
        tenantId: null,
        tenantName: null,
        tokenExpiresAt: null,
      },
    });

    return res.ok({ disconnected: true });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[quickbooks/disconnect]', err);
    return res.error();
  }
}
