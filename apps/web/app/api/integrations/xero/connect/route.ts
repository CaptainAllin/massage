import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const clientId = process.env.XERO_CLIENT_ID;
    if (!clientId) return res.error('Xero integration is not configured');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/integrations/xero/callback`;
    const state = Buffer.from(JSON.stringify({ businessId, userId: user.id })).toString('base64');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile email accounting.transactions accounting.settings offline_access',
      state,
    });

    const authUrl = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
    return res.ok({ authUrl });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[xero/connect]', err);
    return res.error();
  }
}
