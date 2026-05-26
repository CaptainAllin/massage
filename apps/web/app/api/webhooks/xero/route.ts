import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-xero-signature');

  // Validate webhook signature using the integration's webhookKey
  const payload = JSON.parse(body);
  const tenantId = payload.events?.[0]?.tenantId;

  if (tenantId) {
    const integration = await prisma.accountingIntegration.findFirst({
      where: { tenantId, provider: 'XERO', status: 'CONNECTED' },
    });

    if (integration?.webhookKey && signature) {
      const hmac = crypto
        .createHmac('sha256', integration.webhookKey)
        .update(body)
        .digest('base64');
      if (hmac !== signature) {
        return new Response('Invalid signature', { status: 401 });
      }
    }

    if (integration) {
      for (const event of payload.events || []) {
        await handleXeroEvent(event, integration);
      }
    }
  }

  return new Response('OK', { status: 200 });
}

async function handleXeroEvent(event: any, integration: any) {
  const { eventCategory, resourceId } = event;

  if (eventCategory !== 'INVOICE') return;

  try {
    const accessToken = await getValidAccessToken(integration);
    if (!accessToken) return;

    // Fetch the invoice from Xero
    const xeroRes = await fetch(`https://api.xero.com/api.xro/2.0/Invoices/${resourceId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-Tenant-Id': integration.tenantId,
        Accept: 'application/json',
      },
    });

    if (!xeroRes.ok) return;
    const data = await xeroRes.json();
    const xeroInvoice = data.Invoices?.[0];
    if (!xeroInvoice) return;

    // Find the matching local invoice by reference (we set reference = invoice.id)
    const localInvoiceId = xeroInvoice.Reference;
    if (!localInvoiceId) return;

    const localInvoice = await prisma.invoice.findFirst({
      where: { id: localInvoiceId, businessId: integration.businessId },
    });

    if (!localInvoice) return;

    const xeroStatus = xeroInvoice.Status;
    let newLocalStatus: string | null = null;

    if (xeroStatus === 'PAID' && localInvoice.status !== 'PAID') {
      newLocalStatus = 'PAID';
    } else if (xeroStatus === 'VOIDED' && localInvoice.status !== 'CANCELLED') {
      newLocalStatus = 'CANCELLED';
    }

    if (newLocalStatus) {
      // Check for conflict: local was also modified after last sync
      const lastSync = await prisma.accountingSyncLog.findFirst({
        where: { integrationId: integration.id, entityId: localInvoiceId, status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
      });

      const localModifiedAfterSync = lastSync && localInvoice.updatedAt > lastSync.createdAt;

      if (localModifiedAfterSync) {
        // Conflict — record it for staff to resolve
        await prisma.accountingSyncLog.create({
          data: {
            integrationId: integration.id,
            businessId: integration.businessId,
            entityType: 'INVOICE',
            entityId: localInvoiceId,
            externalId: resourceId,
            direction: 'INBOUND',
            status: 'CONFLICT',
            localSnapshot: localInvoice as any,
            externalSnapshot: xeroInvoice as any,
          },
        });
        return;
      }

      // Apply inbound change
      await prisma.invoice.update({
        where: { id: localInvoiceId },
        data: {
          status: newLocalStatus as any,
          ...(newLocalStatus === 'PAID' ? {
            paidAt: xeroInvoice.FullyPaidOnDate ? new Date(xeroInvoice.FullyPaidOnDate) : new Date(),
            amountPaid: xeroInvoice.AmountPaid || localInvoice.total,
            amountDue: 0,
          } : {}),
        },
      });

      await prisma.accountingSyncLog.create({
        data: {
          integrationId: integration.id,
          businessId: integration.businessId,
          entityType: 'INVOICE',
          entityId: localInvoiceId,
          externalId: resourceId,
          direction: 'INBOUND',
          status: 'SUCCESS',
          externalSnapshot: xeroInvoice as any,
        },
      });
    }
  } catch (err) {
    console.error('[xero/webhook/event]', err);
  }
}
