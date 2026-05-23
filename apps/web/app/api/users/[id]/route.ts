import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Business owners can update roles for users in their business (therapists/receptionists)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, role } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!role) return res.badRequest('role is required');

    // Only business owners can reassign roles
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return res.notFound('Business not found');
    if (currentUser.role !== 'SUPER_ADMIN' && business.ownerId !== currentUser.id) {
      return res.forbidden('Only the business owner can update team member roles');
    }

    // Prevent demoting self
    if (id === currentUser.id) return res.badRequest('Cannot change your own role');

    // Verify the target user belongs to this business (via therapist link)
    const therapist = await prisma.therapist.findFirst({ where: { userId: id, businessId } });
    if (!therapist) return res.forbidden('User is not a member of this business');

    const ALLOWED_ROLES = ['THERAPIST', 'RECEPTIONIST'];
    if (!ALLOWED_ROLES.includes(role)) return res.badRequest('Invalid role');

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        businessId,
        action: 'USER_ROLE_UPDATED',
        entityType: 'User',
        entityId: id,
        metadata: { newRole: role },
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
