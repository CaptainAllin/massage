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
    return NextResponse.redirect(`${settingsUrl}?hubspot=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?hubspot=error&reason=missing_params`);
  }

  let businessId: string;
  try {
    ({ businessId } = JSON.parse(Buffer.from(state, 'base64').toString()));
  } catch {
    return NextResponse.redirect(`${settingsUrl}?hubspot=error&reason=invalid_state`);
  }

  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${settingsUrl}?hubspot=error&reason=not_configured`);
  }

  const redirectUri = `${baseUrl}/api/integrations/hubspot/callback`;

  try {
    const tokenRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const data = await tokenRes.json() as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
    };

    if (!data.access_token) {
      console.error('[hubspot/callback] token exchange failed:', data.error);
      return NextResponse.redirect(`${settingsUrl}?hubspot=error&reason=${encodeURIComponent(data.error ?? 'token_failed')}`);
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { hubspotAccessToken: data.access_token } as any,
    });

    return NextResponse.redirect(`${settingsUrl}?hubspot=success`);
  } catch (err) {
    console.error('[hubspot/callback]', err);
    return NextResponse.redirect(`${settingsUrl}?hubspot=error&reason=server_error`);
  }
}
