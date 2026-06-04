import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessRole, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();

    const member = await prisma.businessMember.findUnique({ where: { id } });
    if (!member) return res.notFound('Member not found');

    await requireBusinessRole(user, member.businessId, ['OWNER']);

    if (member.role === 'OWNER') return res.forbidden('Cannot modify the business owner');

    const { role, status, permissions } = body;
    const validRoles = ['THERAPIST', 'SENIOR_THERAPIST', 'RECEPTIONIST'];
    if (role && !validRoles.includes(role)) return res.badRequest('Invalid role');

    const updated = await prisma.businessMember.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(status && { status }),
        // null clears overrides; object stores { grant, revoke }
        ...(permissions !== undefined && { permissions: permissions === null ? null : { grant: permissions.grant ?? [], revoke: permissions.revoke ?? [] } }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId: member.businessId,
        action: 'STAFF_MEMBER_UPDATED',
        entityType: 'BusinessMember',
        entityId: id,
        metadata: { role, status },
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API business-members PATCH]', err);
    return res.error();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const member = await prisma.businessMember.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!member) return res.notFound('Member not found');

    await requireBusinessRole(user, member.businessId, ['OWNER']);

    if (member.role === 'OWNER') return res.forbidden('Cannot remove the business owner');

    // Soft-remove: mark INACTIVE so historical records are preserved
    await prisma.businessMember.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    // 7.2.2 — flag the removed member's future appointments for reassignment
    const therapist = await prisma.therapist.findFirst({
      where: { userId: member.userId, businessId: member.businessId },
      select: { id: true },
    });
    let flaggedCount = 0;
    if (therapist) {
      const now = new Date();
      const result = await prisma.appointment.updateMany({
        where: {
          therapistId: therapist.id,
          businessId: member.businessId,
          startTime: { gt: now },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        data: { needsReassignment: true },
      });
      flaggedCount = result.count;
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId: member.businessId,
        action: 'STAFF_MEMBER_REMOVED',
        entityType: 'BusinessMember',
        entityId: id,
        metadata: { email: member.user.email, role: member.role, flaggedAppointments: flaggedCount },
      },
    });

    return res.ok({ message: 'Member removed', flaggedAppointments: flaggedCount });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API business-members DELETE]', err);
    return res.error();
  }
}
