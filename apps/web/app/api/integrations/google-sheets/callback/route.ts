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
    return NextResponse.redirect(`${settingsUrl}?google=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?google=error&reason=missing_params`);
  }

  let businessId: string;
  try {
    ({ businessId } = JSON.parse(Buffer.from(state, 'base64').toString()));
  } catch {
    return NextResponse.redirect(`${settingsUrl}?google=error&reason=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${settingsUrl}?google=error&reason=not_configured`);
  }

  const redirectUri = `${baseUrl}/api/integrations/google-sheets/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await tokenRes.json() as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
    };

    if (!data.access_token) {
      console.error('[google-sheets/callback] token exchange failed:', data.error);
      return NextResponse.redirect(`${settingsUrl}?google=error&reason=${encodeURIComponent(data.error ?? 'token_failed')}`);
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        googleAccessToken: data.access_token,
        googleRefreshToken: data.refresh_token ?? null,
      } as any,
    });

    return NextResponse.redirect(`${settingsUrl}?google=success`);
  } catch (err) {
    console.error('[google-sheets/callback]', err);
    return NextResponse.redirect(`${settingsUrl}?google=error&reason=server_error`);
  }
}
