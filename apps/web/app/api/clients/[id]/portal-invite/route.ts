import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { sendEmail } from '@/lib/email';

export const POST = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    const { id: clientId } = params;
    const { businessId } = await req.json();
    if (!businessId) return res.badRequest('businessId is required');

    await requireBusinessAccess(user, businessId);

    const [client, business] = await Promise.all([
      prisma.client.findFirst({
        where: { id: clientId, businessId },
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
      (prisma.business.findUnique as any)({
        where: { id: businessId },
        select: { name: true, clientPortalEnabled: true },
      }),
    ]);

    if (!client) return res.notFound('Client not found');
    if (!client.email) return res.badRequest('Client has no email address');
    if (!business) return res.notFound('Business not found');
    if (!business.clientPortalEnabled) {
      return res.badRequest('Client portal is not enabled. Enable it in Settings first.');
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/client-portal/sign-in`;
    const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'there';

    await sendEmail({
      to: client.email,
      subject: `Access your client portal — ${business.name}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;">
          <h2 style="margin:0 0 8px;color:#1E1830;">Hi ${clientName},</h2>
          <p style="color:#4B4466;line-height:1.6;">
            ${business.name} has invited you to access your client portal — a secure space where you can view your appointments, invoices, intake forms, and documents online.
          </p>
          <div style="margin:28px 0;text-align:center;">
            <a href="${portalUrl}" style="display:inline-block;background:#5D4AA8;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;">
              Access My Portal
            </a>
          </div>
          <p style="color:#7A7090;font-size:13px;line-height:1.5;">
            Sign in with your email address (<strong>${client.email}</strong>). If you don't have an account yet, you can create one on the sign-in page.
          </p>
          <hr style="border:none;border-top:1px solid #EFE9F2;margin:24px 0;" />
          <p style="color:#9E96B0;font-size:12px;margin:0;">${business.name} uses Iris Care Suite for practice management.</p>
        </div>
      `,
    });

    return res.ok({ sent: true });
  }
);
