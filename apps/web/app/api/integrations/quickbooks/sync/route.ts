import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

async function getValidAccessToken(integration: any): Promise<string | null> {
  if (!integration.accessToken) return null;
  const needsRefresh = integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < new Date(Date.now() + 60_000);
  if (!needsRefresh) return integration.accessToken;
  if (!integration.refreshToken) return null;

  const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;

  const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      Accept: 'application/json',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: integration.refreshToken }),
  });

  if (!tokenRes.ok) return null;
  const tokens = await tokenRes.json();

  await prisma.accountingIntegration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || integration.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return tokens.access_token;
}

async function pushInvoiceToQuickBooks(
  accessToken: string,
  realmId: string,
  invoice: any,
  integrationId: string,
  businessId: string
) {
  const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
  const baseApiUrl = environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  const client = invoice.client;
  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];

  const qbInvoice = {
    Line: lineItems.map((item: any, idx: number) => ({
      Id: String(idx + 1),
      LineNum: idx + 1,
      Amount: item.total || item.price || 0,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: { value: '1', name: 'Services' },
        Qty: item.quantity || 1,
        UnitPrice: item.unitPrice || item.price || 0,
      },
      Description: item.description || item.name || 'Service',
    })),
    CustomerRef: { value: '1', name: `${client?.firstName || ''} ${client?.lastName || ''}`.trim() },
    DocNumber: invoice.invoiceNumber,
    TxnDate: invoice.issuedAt
      ? new Date(invoice.issuedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    DueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : undefined,
    PrivateNote: `Local ID: ${invoice.id}`,
  };

  const syncLog = await prisma.accountingSyncLog.create({
    data: {
      integrationId,
      businessId,
      entityType: 'INVOICE',
      entityId: invoice.id,
      direction: 'OUTBOUND',
      status: 'PENDING',
      localSnapshot: qbInvoice as any,
    },
  });

  const existing = await prisma.accountingSyncLog.findFirst({
    where: { integrationId, entityType: 'INVOICE', entityId: invoice.id, status: 'SUCCESS' },
    orderBy: { createdAt: 'desc' },
  });

  let qbResponse: Response;

  if (existing?.externalId) {
    // Sparse update
    qbResponse = await fetch(`${baseApiUrl}/v3/company/${realmId}/invoice?minorversion=65`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ ...qbInvoice, Id: existing.externalId, sparse: true }),
    });
  } else {
    qbResponse = await fetch(`${baseApiUrl}/v3/company/${realmId}/invoice?minorversion=65`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(qbInvoice),
    });
  }

  if (qbResponse.ok) {
    const data = await qbResponse.json();
    const qbId = data.Invoice?.Id;
    await prisma.accountingSyncLog.update({
      where: { id: syncLog.id },
      data: { status: 'SUCCESS', externalId: qbId },
    });
    return { success: true, externalId: qbId };
  } else {
    const errText = await qbResponse.text();
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
      where: { businessId_provider: { businessId, provider: 'QUICKBOOKS' } },
    });

    if (!integration || integration.status !== 'CONNECTED') {
      return res.badRequest('QuickBooks is not connected');
    }

    const accessToken = await getValidAccessToken(integration);
    if (!accessToken) {
      await prisma.accountingIntegration.update({
        where: { id: integration.id },
        data: { status: 'ERROR' },
      });
      return res.error('Failed to refresh QuickBooks access token');
    }

    const realmId = integration.tenantId!;
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const invoices = await prisma.invoice.findMany({
      where: { businessId, createdAt: { gte: since } },
      include: { client: true },
      take: 100,
    });

    const results = await Promise.allSettled(
      invoices.map((inv) => pushInvoiceToQuickBooks(accessToken, realmId, inv, integration.id, businessId))
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
    console.error('[quickbooks/sync]', err);
    return res.error();
  }
}
