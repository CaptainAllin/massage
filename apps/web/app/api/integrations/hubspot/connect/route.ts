import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    if (!clientId) return res.error('HubSpot integration is not configured (missing HUBSPOT_CLIENT_ID)');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/integrations/hubspot/callback`;
    const state = Buffer.from(JSON.stringify({ businessId, userId: user.id })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'crm.objects.contacts.write crm.objects.deals.write',
      state,
    });

    const authUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
    return res.ok({ authUrl });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[hubspot/connect]', err);
    return res.error();
  }
}
