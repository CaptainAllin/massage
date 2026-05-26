import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const noteInclude = {
  client: {
    select: { id: true, firstName: true, lastName: true },
  },
  therapist: {
    select: {
      id: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  appointment: {
    select: { id: true, startTime: true, endTime: true },
  },
  reviewer: {
    select: { id: true, firstName: true, lastName: true },
  },
  bodyMaps: true,
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const clientId = searchParams.get('clientId');
    const therapistId = searchParams.get('therapistId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const statusFilter = searchParams.get('status');
    const reviewerId = searchParams.get('reviewerId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { businessId };
    if (clientId) where.clientId = clientId;
    if (therapistId) where.therapistId = therapistId;
    if (statusFilter) where.status = statusFilter;
    if (reviewerId) where.reviewerId = reviewerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Enforce draft note visibility rules
    const isOwner = await prisma.business.findFirst({
      where: { id: businessId, ownerId: user.id },
      select: { id: true, draftNoteVisibility: true },
    });

    if (!isOwner) {
      // Business owner always sees all drafts — only apply rules for non-owners
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { draftNoteVisibility: true },
      });

      const visibility = business?.draftNoteVisibility ?? 'ALL_THERAPISTS';

      if (visibility === 'ONLY_AUTHOR') {
        // Therapist only sees their own drafts; can see approved/non-draft notes from others
        const therapistRecord = await prisma.therapist.findFirst({
          where: { businessId, userId: user.id },
          select: { id: true },
        });
        if (therapistRecord) {
          where.OR = [
            { status: { not: 'DRAFT' } },
            { therapistId: therapistRecord.id },
          ];
        }
      } else if (visibility === 'BUSINESS_OWNER_ONLY') {
        // Non-owners cannot see any drafts at all
        where.status = { not: 'DRAFT' };
      }
      // ALL_THERAPISTS: no extra filter — everyone sees all notes
    }

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      prisma.treatmentNote.findMany({
        where,
        include: noteInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.treatmentNote.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: notes,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, appointmentId, clientId, therapistId, ...rest } = body;

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);
    if (!clientId) return res.badRequest('clientId is required');
    if (!therapistId) return res.badRequest('therapistId is required');
    if (!appointmentId) return res.badRequest('appointmentId is required');

    const note = await prisma.treatmentNote.create({
      data: {
        businessId,
        appointmentId,
        clientId,
        therapistId,
        subjectiveFindings: rest.subjectiveFindings,
        objectiveFindings: rest.objectiveFindings,
        assessment: rest.assessment,
        plan: rest.plan,
        areasWorked: rest.areasWorked || [],
        techniques: rest.techniques || [],
        sessionDuration: rest.sessionDuration,
        followUpDate: rest.followUpDate ? new Date(rest.followUpDate) : undefined,
        noteTemplateId: rest.noteTemplateId ?? null,
        noteTemplateName: rest.noteTemplateName ?? null,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        therapist: {
          select: {
            id: true,
            userId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        appointment: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'TREATMENT_NOTE_CREATED',
        entityType: 'TreatmentNote',
        entityId: note.id,
        metadata: { clientId, appointmentId },
      },
    });

    return res.created(note);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
