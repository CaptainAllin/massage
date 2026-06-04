import { NextRequest } from 'next/server';
import { res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// Public route — validates an invite token and returns invite details
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    const invite = await prisma.staffInvite.findUnique({
      where: { token },
      include: {
        business: { select: { id: true, name: true, logo: true } },
        sentByUser: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invite) return res.notFound('Invite not found or already used');
    if (invite.acceptedAt) return res.badRequest('Invite has already been accepted');
    if (invite.expiresAt < new Date()) return res.badRequest('Invite has expired');

    return res.ok({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      business: invite.business,
      inviterName: `${invite.sentByUser.firstName} ${invite.sentByUser.lastName}`.trim(),
    });
  } catch (err) {
    console.error('[API staff-invites validate]', err);
    return res.error();
  }
}
