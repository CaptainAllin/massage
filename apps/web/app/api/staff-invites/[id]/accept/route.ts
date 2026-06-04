import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendStaffWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const invite = await prisma.staffInvite.findUnique({
      where: { id },
      include: { business: { select: { id: true, name: true } } },
    });

    if (!invite) return res.notFound('Invite not found');
    if (invite.acceptedAt) return res.badRequest('Invite has already been accepted');
    if (invite.expiresAt < new Date()) return res.badRequest('Invite has expired');

    // Verify the invite email matches the logged-in user
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.forbidden('This invite was sent to a different email address');
    }

    // Check if already a member
    const existing = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId: invite.businessId } },
    });
    if (existing && existing.status === 'ACTIVE') {
      return res.badRequest('You are already a member of this business');
    }

    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.businessMember.update({
          where: { id: existing.id },
          data: { role: invite.role, status: 'ACTIVE', joinedAt: new Date() },
        });
      } else {
        await tx.businessMember.create({
          data: {
            userId: user.id,
            businessId: invite.businessId,
            role: invite.role,
            status: 'ACTIVE',
            invitedAt: invite.createdAt,
            joinedAt: new Date(),
          },
        });
      }

      // Create Therapist profile for therapist roles if none exists
      if (invite.role === 'THERAPIST' || invite.role === 'SENIOR_THERAPIST') {
        const hasTherapist = await tx.therapist.findFirst({
          where: { userId: user.id, businessId: invite.businessId },
        });
        if (!hasTherapist) {
          await tx.therapist.create({
            data: {
              userId: user.id,
              businessId: invite.businessId,
              isActive: true,
            },
          });
        }
      }

      await tx.staffInvite.update({
        where: { id },
        data: { acceptedAt: new Date() },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId: invite.businessId,
        action: 'STAFF_INVITE_ACCEPTED',
        entityType: 'StaffInvite',
        entityId: id,
        metadata: { email: user.email, role: invite.role },
      },
    });

    // 7.1.1 — notify staff they've been added to the business (respect user notification prefs)
    if (user.email) {
      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true, notificationPrefs: true } });
      const prefs = fullUser?.notificationPrefs as Record<string, boolean> | null;
      const wantsEmail = prefs?.teamJoined !== false;
      if (wantsEmail) {
        const staffName = [fullUser?.firstName, fullUser?.lastName].filter(Boolean).join(' ') || user.email;
        sendStaffWelcomeEmail({
          to: user.email,
          staffName,
          businessName: invite.business.name,
          role: invite.role,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard`,
        }).catch(() => {});
      }
    }

    return res.ok({ businessId: invite.businessId, businessName: invite.business.name, role: invite.role });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API staff-invites accept]', err);
    return res.error();
  }
}
