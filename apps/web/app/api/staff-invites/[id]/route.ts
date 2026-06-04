import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessRole, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const invite = await prisma.staffInvite.findUnique({ where: { id } });
    if (!invite) return res.notFound('Invite not found');

    await requireBusinessRole(user, invite.businessId, ['OWNER']);

    await prisma.staffInvite.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId: invite.businessId,
        action: 'STAFF_INVITE_CANCELLED',
        entityType: 'StaffInvite',
        entityId: id,
        metadata: { email: invite.email, role: invite.role },
      },
    });

    return res.ok({ message: 'Invite cancelled' });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API staff-invites DELETE]', err);
    return res.error();
  }
}
