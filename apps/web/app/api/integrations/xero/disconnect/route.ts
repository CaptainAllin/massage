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
      where: { businessId_provider: { businessId, provider: 'XERO' } },
    });

    if (!integration) return res.notFound('Xero integration not found');

    // Revoke token from Xero if we have one
    if (integration.accessToken) {
      try {
        const clientId = process.env.XERO_CLIENT_ID!;
        const clientSecret = process.env.XERO_CLIENT_SECRET!;
        await fetch('https://identity.xero.com/connect/revocation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({ token: integration.refreshToken || integration.accessToken }),
        });
      } catch {
        // Non-fatal — proceed with local disconnect
      }
    }

    await prisma.accountingIntegration.update({
      where: { businessId_provider: { businessId, provider: 'XERO' } },
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
    console.error('[xero/disconnect]', err);
    return res.error();
  }
}
