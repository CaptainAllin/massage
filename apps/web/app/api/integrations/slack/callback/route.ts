import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const settingsUrl = `${baseUrl}/settings/integrations`;

  if (error) {
    return NextResponse.redirect(`${settingsUrl}?slack=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?slack=error&reason=missing_params`);
  }

  let businessId: string;
  try {
    ({ businessId } = JSON.parse(Buffer.from(state, 'base64').toString()));
  } catch {
    return NextResponse.redirect(`${settingsUrl}?slack=error&reason=invalid_state`);
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${settingsUrl}?slack=error&reason=not_configured`);
  }

  const redirectUri = `${baseUrl}/api/integrations/slack/callback`;

  try {
    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
    });

    const data = await tokenRes.json() as {
      ok: boolean;
      error?: string;
      access_token?: string;
      incoming_webhook?: { channel?: string };
    };

    if (!data.ok || !data.access_token) {
      console.error('[slack/callback] token exchange failed:', data.error);
      return NextResponse.redirect(`${settingsUrl}?slack=error&reason=${encodeURIComponent(data.error ?? 'token_failed')}`);
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        slackAccessToken: data.access_token,
        slackDefaultChannel: data.incoming_webhook?.channel ?? null,
      },
    });

    return NextResponse.redirect(`${settingsUrl}?slack=success`);
  } catch (err) {
    console.error('[slack/callback]', err);
    return NextResponse.redirect(`${settingsUrl}?slack=error&reason=server_error`);
  }
}
