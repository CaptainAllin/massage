import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Admin: approve or reject a community template
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BUSINESS_OWNER') {
      return res.forbidden('Admin access required');
    }

    const { id } = params;
    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return res.badRequest('action must be approve or reject');
    }

    const existing = await prisma.communityTemplate.findUnique({ where: { id } });
    if (!existing) return res.notFound('Community template not found');
    if (existing.status !== 'PENDING') return res.badRequest('Template is not pending review');

    if (action === 'reject' && !rejectionReason?.trim()) {
      return res.badRequest('rejectionReason is required when rejecting');
    }

    const updated = await prisma.communityTemplate.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        moderatedBy: user.id,
        moderatedAt: new Date(),
        ...(action === 'reject' && { rejectionReason: rejectionReason.trim() }),
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
