import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, comment } = body;

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const note = await prisma.treatmentNote.findFirst({ where: { id, businessId } });
    if (!note) return res.notFound('Treatment note not found');
    if (note.status !== 'PENDING_REVIEW') {
      return res.badRequest('Only notes PENDING_REVIEW can be rejected');
    }

    // Only the assigned reviewer or business owner can reject
    const isOwner = await prisma.business.findFirst({
      where: { id: businessId, ownerId: user.id },
    });
    if (!isOwner && note.reviewerId !== user.id) {
      return res.forbidden('Only the assigned reviewer can reject this note');
    }

    const updated = await prisma.treatmentNote.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewComment: comment || null,
        reviewedAt: new Date(),
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        therapist: {
          select: { id: true, userId: true, user: { select: { firstName: true, lastName: true } } },
        },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'TREATMENT_NOTE_REJECTED',
        entityType: 'TreatmentNote',
        entityId: id,
        metadata: { rejectedById: user.id, comment },
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
