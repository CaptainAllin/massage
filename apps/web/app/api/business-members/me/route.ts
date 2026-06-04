import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { resolvePermissions, type PermissionOverrides } from '@/lib/permissions';

/**
 * GET /api/business-members/me?businessId=xxx
 *
 * Returns the current user's role and fully resolved effective permissions
 * (role defaults → business role overrides → member overrides).
 *
 * Response: { role: string; permissions: string[] }
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    if (user.role === 'SUPER_ADMIN') {
      return res.ok({ role: 'OWNER', permissions: [] });
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId },
      select: { ownerId: true, rolePermissions: true },
    });

    if (!business) return res.notFound('Business not found');

    if (business.ownerId === user.id) {
      // Owner always has every permission — no need to resolve
      return res.ok({ role: 'OWNER', permissions: [] });
    }

    const member = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
      select: { role: true, permissions: true, status: true },
    });

    if (!member || member.status === 'INACTIVE') {
      return res.forbidden('Not a member of this business');
    }

    const roleOverrides = ((business.rolePermissions as Record<string, PermissionOverrides>) ?? {})[member.role];
    const memberOverrides = member.permissions as PermissionOverrides | null;

    const effective = resolvePermissions(member.role, memberOverrides, roleOverrides);

    return res.ok({
      role: member.role,
      permissions: Array.from(effective),
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API business-members/me GET]', err);
    return res.error();
  }
}
