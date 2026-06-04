import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessRole, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendStaffInviteEmail } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const invite = await prisma.staffInvite.findUnique({
      where: { id },
      include: { business: { select: { name: true } } },
    });
    if (!invite) return res.notFound('Invite not found');
    if (invite.acceptedAt) return res.badRequest('Invite has already been accepted');

    await requireBusinessRole(user, invite.businessId, ['OWNER']);

    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.staffInvite.update({
      where: { id },
      data: { expiresAt: newExpiry },
    });

    const inviterUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true },
    });
    const inviterName = inviterUser ? `${inviterUser.firstName} ${inviterUser.lastName}`.trim() : 'Your practice';
    const inviteUrl = `${APP_URL}/accept-invite?token=${invite.token}`;

    await sendStaffInviteEmail({
      to: invite.email,
      businessName: invite.business.name,
      inviterName,
      role: invite.role,
      inviteUrl,
      expiresAt: newExpiry,
    });

    return res.ok({ message: 'Invite resent' });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API staff-invites resend]', err);
    return res.error();
  }
}
