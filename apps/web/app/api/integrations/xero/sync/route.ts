import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

async function getValidAccessToken(integration: any): Promise<string | null> {
  if (!integration.accessToken) return null;

  const needsRefresh = integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < new Date(Date.now() + 60_000);
  if (!needsRefresh) return integration.accessToken;

  if (!integration.refreshToken) return null;

  const clientId = process.env.XERO_CLIENT_ID!;
  const clientSecret = process.env.XERO_CLIENT_SECRET!;

  const tokenRes = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refreshToken,
    }),
  });

  if (!tokenRes.ok) return null;

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.accountingIntegration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || integration.refreshToken,
      tokenExpiresAt: expiresAt,
    },
  });

  return tokens.access_token;
}

async function pushInvoiceToXero(
  accessToken: string,
  tenantId: string,
  invoice: any,
  integrationId: string,
  businessId: string
) {
  const client = invoice.client;
  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];

  const xeroInvoice = {
    Type: 'ACCREC',
    Contact: {
      Name: `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 'Unknown Client',
      EmailAddress: client?.email || undefined,
    },
    LineItems: lineItems.map((item: any) => ({
      Description: item.description || item.name || 'Service',
      Quantity: item.quantity || 1,
      UnitAmount: item.unitPrice || item.price || 0,
      AccountCode: '200',
    })),
    Date: invoice.issuedAt
      ? new Date(invoice.issuedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    DueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : undefined,
    InvoiceNumber: invoice.invoiceNumber,
    Reference: invoice.id,
    Status: invoice.status === 'PAID' ? 'PAID' : invoice.status === 'DRAFT' ? 'DRAFT' : 'AUTHORISED',
  };

  const syncLog = await prisma.accountingSyncLog.create({
    data: {
      integrationId,
      businessId,
      entityType: 'INVOICE',
      entityId: invoice.id,
      direction: 'OUTBOUND',
      status: 'PENDING',
      localSnapshot: xeroInvoice as any,
    },
  });

  const existing = await prisma.accountingSyncLog.findFirst({
    where: { integrationId, entityType: 'INVOICE', entityId: invoice.id, status: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
  });

  let xeroResponse: Response;

  if (existing?.externalId) {
    xeroResponse = await fetch(`https://api.xero.com/api.xro/2.0/Invoices/${existing.externalId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-Tenant-Id': tenantId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ Invoices: [{ ...xeroInvoice, InvoiceID: existing.externalId }] }),
    });
  } else {
    xeroResponse = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-Tenant-Id': tenantId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ Invoices: [xeroInvoice] }),
    });
  }

  if (xeroResponse.ok) {
    const data = await xeroResponse.json();
    const xeroId = data.Invoices?.[0]?.InvoiceID;
    await prisma.accountingSyncLog.update({
      where: { id: syncLog.id },
      data: { status: 'SUCCESS', externalId: xeroId },
    });
    return { success: true, externalId: xeroId };
  } else {
    const errText = await xeroResponse.text();
    await prisma.accountingSyncLog.update({
      where: { id: syncLog.id },
      data: { status: 'FAILED', errorMessage: errText },
    });
    return { success: false, error: errText };
  }
}

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

    if (!integration || integration.status !== 'CONNECTED') {
      return res.badRequest('Xero is not connected');
    }

    const accessToken = await getValidAccessToken(integration);
    if (!accessToken) {
      await prisma.accountingIntegration.update({
        where: { id: integration.id },
        data: { status: 'ERROR' },
      });
      return res.error('Failed to refresh Xero access token');
    }

    const tenantId = integration.tenantId!;

    // Sync recent invoices (last 90 days)
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const invoices = await prisma.invoice.findMany({
      where: { businessId, createdAt: { gte: since } },
      include: { client: true },
      take: 100,
    });

    const results = await Promise.allSettled(
      invoices.map((inv) => pushInvoiceToXero(accessToken, tenantId, inv, integration.id, businessId))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled' && (r as any).value?.success).length;
    const failed = results.length - succeeded;

    await prisma.accountingIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return res.ok({ synced: succeeded, failed, total: results.length });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[xero/sync]', err);
    return res.error();
  }
}
