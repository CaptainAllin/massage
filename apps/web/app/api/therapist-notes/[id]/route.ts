import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const noteInclude = {
  client: { select: { id: true, firstName: true, lastName: true } },
  therapist: {
    select: {
      id: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
};

async function getTherapistId(userId: string): Promise<string | null> {
  const therapist = await prisma.therapist.findFirst({ where: { userId } });
  return therapist?.id || null;
}

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

    const note = await prisma.therapistNote.findFirst({
      where: { id, businessId },
      include: { client: true, therapist: { include: { user: true } } },
    });

    if (!note) return res.notFound('Therapist note not found');

    // RBAC: Therapists can only access their own notes
    if (user.role === 'THERAPIST') {
      const therapistId = await getTherapistId(user.id);
      if (note.therapistId !== therapistId) return res.forbidden('You can only access your own notes');
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

    const existingNote = await prisma.therapistNote.findFirst({ where: { id, businessId } });
    if (!existingNote) return res.notFound('Therapist note not found');

    // RBAC: Therapists can only update their own notes
    if (user.role === 'THERAPIST') {
      const therapistId = await getTherapistId(user.id);
      if (existingNote.therapistId !== therapistId) return res.forbidden('You can only update your own notes');
    }

    const note = await prisma.therapistNote.update({
      where: { id },
      data,
      include: noteInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'THERAPIST_NOTE_UPDATED',
        entityType: 'TherapistNote',
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

    const existingNote = await prisma.therapistNote.findFirst({ where: { id, businessId } });
    if (!existingNote) return res.notFound('Therapist note not found');

    // RBAC: Therapists can only delete their own notes
    if (user.role === 'THERAPIST') {
      const therapistId = await getTherapistId(user.id);
      if (existingNote.therapistId !== therapistId) return res.forbidden('You can only delete your own notes');
    }

    const note = await prisma.therapistNote.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'THERAPIST_NOTE_DELETED',
        entityType: 'TherapistNote',
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
