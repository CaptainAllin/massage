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
    const { businessId, reviewerId } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!reviewerId) return res.badRequest('reviewerId is required');
    await requireBusinessAccess(user, businessId);

    const note = await prisma.treatmentNote.findFirst({ where: { id, businessId } });
    if (!note) return res.notFound('Treatment note not found');
    if (note.status !== 'DRAFT' && note.status !== 'REJECTED') {
      return res.badRequest('Only DRAFT or REJECTED notes can be submitted for review');
    }

    // Verify reviewer exists and belongs to the business
    const reviewer = await prisma.user.findFirst({
      where: {
        id: reviewerId,
        therapist: { businessId },
      },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!reviewer) return res.badRequest('Reviewer not found in this business');

    const updated = await prisma.treatmentNote.update({
      where: { id },
      data: {
        status: 'PENDING_REVIEW',
        reviewerId,
        reviewComment: null,
        submittedForReviewAt: new Date(),
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
        action: 'TREATMENT_NOTE_SUBMITTED_FOR_REVIEW',
        entityType: 'TreatmentNote',
        entityId: id,
        metadata: { reviewerId },
      },
    });

    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
