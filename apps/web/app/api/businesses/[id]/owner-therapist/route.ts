/**
 * GET  /api/businesses/[id]/owner-therapist — fetch current isTherapist state
 * PATCH /api/businesses/[id]/owner-therapist — toggle "I also work as a therapist"
 */
import { requireAuth, requireBusinessRole, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const businessId = params.id;
    await requireBusinessRole(user, businessId, ['OWNER']);

    const member = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
      select: { isTherapist: true },
    });

    return res.ok({ isTherapist: member?.isTherapist ?? false });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const businessId = params.id;
    const { enabled } = await req.json();

    if (typeof enabled !== 'boolean') return res.badRequest('enabled (boolean) is required');

    // Only the business owner can toggle this setting
    await requireBusinessRole(user, businessId, ['OWNER']);

    const member = await prisma.businessMember.upsert({
      where: { userId_businessId: { userId: user.id, businessId } },
      create: {
        userId: user.id,
        businessId,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: new Date(),
        isTherapist: enabled,
      },
      update: { isTherapist: enabled },
    });

    if (enabled) {
      // Auto-create Therapist record if it doesn't exist
      const existing = await prisma.therapist.findFirst({
        where: { userId: user.id, businessId },
      });
      if (!existing) {
        const userRecord = await prisma.user.findUnique({
          where: { id: user.id },
          select: { firstName: true, lastName: true },
        });
        await prisma.therapist.create({
          data: {
            userId: user.id,
            businessId,
            isActive: true,
            bio: `${userRecord?.firstName ?? ''} ${userRecord?.lastName ?? ''}`.trim() || undefined,
          },
        });
      } else if (!existing.isActive) {
        await prisma.therapist.update({ where: { id: existing.id }, data: { isActive: true } });
      }
    } else {
      // Deactivate the therapist record (don't delete — preserves booking history)
      const existing = await prisma.therapist.findFirst({
        where: { userId: user.id, businessId },
      });
      if (existing) {
        await prisma.therapist.update({ where: { id: existing.id }, data: { isActive: false } });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: enabled ? 'OWNER_THERAPIST_ENABLED' : 'OWNER_THERAPIST_DISABLED',
        entityType: 'Business',
        entityId: businessId,
      },
    });

    return res.ok({ isTherapist: member.isTherapist });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
