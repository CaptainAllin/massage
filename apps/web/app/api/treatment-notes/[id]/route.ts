import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const note = await prisma.treatmentNote.findFirst({
      where: { id, businessId },
      include: {
        client: true,
        therapist: { include: { user: true } },
        appointment: true,
        bodyMaps: true,
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!note) return res.notFound('Treatment note not found');

    // Enforce draft visibility: only check non-owners for DRAFT notes
    if ((note as any).status === 'DRAFT') {
      const isOwner = await prisma.business.findFirst({
        where: { id: businessId, ownerId: user.id },
        select: { id: true, draftNoteVisibility: true },
      });

      if (!isOwner) {
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          select: { draftNoteVisibility: true },
        });
        const visibility = business?.draftNoteVisibility ?? 'ALL_THERAPISTS';

        if (visibility === 'BUSINESS_OWNER_ONLY') {
          return res.notFound('Treatment note not found');
        }

        if (visibility === 'ONLY_AUTHOR') {
          const therapist = await prisma.therapist.findFirst({
            where: { businessId, userId: user.id },
            select: { id: true },
          });
          if (!therapist || therapist.id !== (note as any).therapistId) {
            return res.notFound('Treatment note not found');
          }
        }
      }
    }

    return res.ok(note);
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
    const { id } = params;
    const body = await req.json();
    const { businessId, ...data } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.treatmentNote.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Treatment note not found');

    // Convert followUpDate if provided
    if (data.followUpDate) {
      data.followUpDate = new Date(data.followUpDate);
    }

    const note = await prisma.treatmentNote.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        therapist: {
          select: {
            id: true,
            userId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        bodyMaps: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'TREATMENT_NOTE_UPDATED',
        entityType: 'TreatmentNote',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return res.ok(note);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.treatmentNote.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Treatment note not found');

    const note = await prisma.treatmentNote.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'TREATMENT_NOTE_DELETED',
        entityType: 'TreatmentNote',
        entityId: id,
      },
    });

    return res.ok(note);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
