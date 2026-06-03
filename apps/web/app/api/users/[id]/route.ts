import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Business owners can update roles and profile fields for users in their business
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, role, firstName, lastName, phoneNumber, email } = body;

    if (!businessId) return res.badRequest('businessId is required');

    if (email !== undefined && email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.badRequest('Invalid email address');
    }

    const hasUpdate = role || firstName !== undefined || lastName !== undefined || phoneNumber !== undefined || email !== undefined;
    if (!hasUpdate) return res.badRequest('At least one field to update is required');

    // Only business owners can update team members
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return res.notFound('Business not found');
    if (currentUser.role !== 'SUPER_ADMIN' && business.ownerId !== currentUser.id) {
      return res.forbidden('Only the business owner can update team members');
    }

    if (id === currentUser.id && role) return res.badRequest('Cannot change your own role');

    // Verify the target user belongs to this business (via therapist link)
    const therapist = await prisma.therapist.findFirst({ where: { userId: id, businessId } });
    if (!therapist) return res.forbidden('User is not a member of this business');

    const ALLOWED_ROLES = ['THERAPIST', 'RECEPTIONIST'];
    if (role && !ALLOWED_ROLES.includes(role)) return res.badRequest('Invalid role');

    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (email !== undefined && email !== '') updateData.email = email;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        businessId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: id,
        metadata: { fields: Object.keys(updateData) },
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
