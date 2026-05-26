import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectBase = `${baseUrl}/settings/integrations`;

  if (error || !code || !stateParam || !realmId) {
    return Response.redirect(`${redirectBase}?quickbooks=error&reason=${encodeURIComponent(error || 'missing_params')}`);
  }

  let businessId: string;
  try {
    const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
    businessId = state.businessId;
  } catch {
    return Response.redirect(`${redirectBase}?quickbooks=error&reason=invalid_state`);
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/integrations/quickbooks/callback`;

  try {
    const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        Accept: 'application/json',
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

    // Get company info
    const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
    const baseApiUrl = environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';

    const companyRes = await fetch(`${baseApiUrl}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=65`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json',
      },
    });

    let companyName = 'QuickBooks Company';
    if (companyRes.ok) {
      const companyData = await companyRes.json();
      companyName = companyData.CompanyInfo?.CompanyName || companyName;
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.accountingIntegration.upsert({
      where: { businessId_provider: { businessId, provider: 'QUICKBOOKS' } },
      create: {
        businessId,
        provider: 'QUICKBOOKS',
        status: 'CONNECTED',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        tenantId: realmId,
        tenantName: companyName,
      },
      update: {
        status: 'CONNECTED',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        tenantId: realmId,
        tenantName: companyName,
      },
    });

    return Response.redirect(`${redirectBase}?quickbooks=connected`);
  } catch (err) {
    console.error('[quickbooks/callback]', err);
    return Response.redirect(`${redirectBase}?quickbooks=error&reason=token_exchange_failed`);
  }
}
