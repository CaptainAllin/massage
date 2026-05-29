import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, apiKey, audienceId } = body;
    if (!businessId) return res.badRequest('businessId is required');
    if (!apiKey) return res.badRequest('apiKey is required');
    await requireBusinessAccess(user, businessId);

    // Validate the API key by fetching the Mailchimp root endpoint
    const dataCenterMatch = apiKey.match(/-([a-z0-9]+)$/);
    if (!dataCenterMatch) return res.badRequest('Invalid Mailchimp API key format');
    const dc = dataCenterMatch[1];

    const testRes = await fetch(`https://${dc}.api.mailchimp.com/3.0/`, {
      headers: { Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}` },
    });
    if (!testRes.ok) return res.badRequest('Invalid Mailchimp API key — authentication failed');

    await prisma.business.update({
      where: { id: businessId },
      data: { mailchimpApiKey: apiKey, mailchimpAudienceId: audienceId ?? null } as any,
    });

    return res.ok({ connected: true });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[mailchimp/connect]', err);
    return res.error();
  }
}
