import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) return res.error('Slack integration is not configured (missing SLACK_CLIENT_ID)');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/integrations/slack/callback`;
    const state = Buffer.from(JSON.stringify({ businessId, userId: user.id })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'chat:write,incoming-webhook',
      redirect_uri: redirectUri,
      state,
    });

    const authUrl = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    return res.ok({ authUrl });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[slack/connect]', err);
    return res.error();
  }
}
