import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectBase = `${baseUrl}/settings/integrations`;

  if (error || !code || !stateParam) {
    return Response.redirect(`${redirectBase}?xero=error&reason=${encodeURIComponent(error || 'missing_code')}`);
  }

  let businessId: string;
  try {
    const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
    businessId = state.businessId;
  } catch {
    return Response.redirect(`${redirectBase}?xero=error&reason=invalid_state`);
  }

  const clientId = process.env.XERO_CLIENT_ID!;
  const clientSecret = process.env.XERO_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/integrations/xero/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
    }

    const tokens = await tokenRes.json();

    // Get tenant connections
    const connectionsRes = await fetch('https://api.xero.com/connections', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const connections = await connectionsRes.json();
    const tenant = connections[0]; // Use first tenant

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.accountingIntegration.upsert({
      where: { businessId_provider: { businessId, provider: 'XERO' } },
      create: {
        businessId,
        provider: 'XERO',
        status: 'CONNECTED',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        tenantId: tenant?.tenantId,
        tenantName: tenant?.tenantName,
      },
      update: {
        status: 'CONNECTED',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        tenantId: tenant?.tenantId,
        tenantName: tenant?.tenantName,
      },
    });

    return Response.redirect(`${redirectBase}?xero=connected`);
  } catch (err) {
    console.error('[xero/callback]', err);
    return Response.redirect(`${redirectBase}?xero=error&reason=token_exchange_failed`);
  }
}
