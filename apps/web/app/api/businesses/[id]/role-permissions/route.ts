import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessRole, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
const EDITABLE_ROLES = ['SENIOR_THERAPIST', 'THERAPIST', 'RECEPTIONIST'];

/**
 * GET /api/businesses/[id]/role-permissions
 *
 * Returns the business-level role permission overrides.
 * Response: Record<role, { grant: string[], revoke: string[] }>
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    await requireBusinessRole(user, id, ['OWNER']);

    const business = await prisma.business.findUnique({
      where: { id },
      select: { rolePermissions: true },
    });

    if (!business) return res.notFound('Business not found');

    const stored = (business.rolePermissions as Record<string, { grant: string[]; revoke: string[] }>) ?? {};

    // Return a complete structure for all editable roles
    const result: Record<string, { grant: string[]; revoke: string[] }> = {};
    for (const role of EDITABLE_ROLES) {
      result[role] = { grant: stored[role]?.grant ?? [], revoke: stored[role]?.revoke ?? [] };
    }

    return res.ok(result);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API businesses/[id]/role-permissions GET]', err);
    return res.error();
  }
}

/**
 * PATCH /api/businesses/[id]/role-permissions
 *
 * Updates the permission overrides for a specific role.
 * Body: { role: string, grant: string[], revoke: string[] }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    await requireBusinessRole(user, id, ['OWNER']);

    const body = await req.json();
    const { role, grant = [], revoke = [] } = body;

    if (!EDITABLE_ROLES.includes(role)) {
      return res.badRequest('Invalid role — only SENIOR_THERAPIST, THERAPIST, RECEPTIONIST are customisable');
    }

    const business = await prisma.business.findUnique({
      where: { id },
      select: { rolePermissions: true },
    });

    if (!business) return res.notFound('Business not found');

    const stored = (business.rolePermissions as Record<string, { grant: string[]; revoke: string[] }>) ?? {};

    const updated = await prisma.business.update({
      where: { id },
      data: {
        rolePermissions: {
          ...stored,
          [role]: { grant, revoke },
        },
      },
      select: { rolePermissions: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId: id,
        action: 'ROLE_PERMISSIONS_UPDATED',
        entityType: 'Business',
        entityId: id,
        metadata: { role, grant, revoke },
      },
    });

    return res.ok((updated.rolePermissions as Record<string, unknown>)[role]);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API businesses/[id]/role-permissions PATCH]', err);
    return res.error();
  }
}
