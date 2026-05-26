import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('intuit-signature');
  const verifierToken = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN;

  if (verifierToken && signature) {
    const hmac = crypto.createHmac('sha256', verifierToken).update(body).digest('base64');
    if (hmac !== signature) {
      return new Response('Invalid signature', { status: 401 });
    }
  }

  const payload = JSON.parse(body);

  for (const notification of payload.eventNotifications || []) {
    const realmId = notification.realmId;

    const integration = await prisma.accountingIntegration.findFirst({
      where: { tenantId: realmId, provider: 'QUICKBOOKS', status: 'CONNECTED' },
    });

    if (!integration) continue;

    for (const entity of notification.dataChangeEvent?.entities || []) {
      if (entity.name === 'Invoice') {
        await handleQuickBooksInvoiceEvent(entity, integration);
      }
    }
  }

  return new Response('OK', { status: 200 });
}

async function handleQuickBooksInvoiceEvent(entity: any, integration: any) {
  const { id: qbInvoiceId, operation } = entity;

  if (operation === 'Delete') return;

  try {
    const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';
    const baseApiUrl = environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';

    // Refresh token if needed
    let accessToken = integration.accessToken;
    const needsRefresh = integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < new Date(Date.now() + 60_000);
    if (needsRefresh && integration.refreshToken) {
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
      if (tokenRes.ok) {
        const tokens = await tokenRes.json();
        accessToken = tokens.access_token;
        await prisma.accountingIntegration.update({
          where: { id: integration.id },
          data: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || integration.refreshToken,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          },
        });
      }
    }

    const qbRes = await fetch(`${baseApiUrl}/v3/company/${integration.tenantId}/invoice/${qbInvoiceId}?minorversion=65`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });

    if (!qbRes.ok) return;
    const data = await qbRes.json();
    const qbInvoice = data.Invoice;
    if (!qbInvoice) return;

    // Extract local invoice ID from PrivateNote
    const privateNote = qbInvoice.PrivateNote || '';
    const match = privateNote.match(/Local ID: (\S+)/);
    if (!match) return;

    const localInvoiceId = match[1];
    const localInvoice = await prisma.invoice.findFirst({
      where: { id: localInvoiceId, businessId: integration.businessId },
    });
    if (!localInvoice) return;

    const qbBalance = qbInvoice.Balance;
    const isPaid = qbBalance === 0 && qbInvoice.TotalAmt > 0;

    if (isPaid && localInvoice.status !== 'PAID') {
      const lastSync = await prisma.accountingSyncLog.findFirst({
        where: { integrationId: integration.id, entityId: localInvoiceId, status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
      });

      const localModifiedAfterSync = lastSync && localInvoice.updatedAt > lastSync.createdAt;

      if (localModifiedAfterSync) {
        await prisma.accountingSyncLog.create({
          data: {
            integrationId: integration.id,
            businessId: integration.businessId,
            entityType: 'INVOICE',
            entityId: localInvoiceId,
            externalId: qbInvoiceId,
            direction: 'INBOUND',
            status: 'CONFLICT',
            localSnapshot: localInvoice as any,
            externalSnapshot: qbInvoice as any,
          },
        });
        return;
      }

      await prisma.invoice.update({
        where: { id: localInvoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          amountPaid: qbInvoice.TotalAmt,
          amountDue: 0,
        },
      });

      await prisma.accountingSyncLog.create({
        data: {
          integrationId: integration.id,
          businessId: integration.businessId,
          entityType: 'INVOICE',
          entityId: localInvoiceId,
          externalId: qbInvoiceId,
          direction: 'INBOUND',
          status: 'SUCCESS',
          externalSnapshot: qbInvoice as any,
        },
      });
    }
  } catch (err) {
    console.error('[quickbooks/webhook/event]', err);
  }
}
