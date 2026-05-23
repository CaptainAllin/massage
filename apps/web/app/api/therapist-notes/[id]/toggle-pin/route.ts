import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || body.businessId;

    if (!businessId) return res.badRequest('businessId is required');

    const existingNote = await prisma.therapistNote.findFirst({ where: { id, businessId } });
    if (!existingNote) return res.notFound('Therapist note not found');

    // RBAC: Therapists can only toggle their own notes
    if (user.role === 'THERAPIST') {
      const therapist = await prisma.therapist.findFirst({ where: { userId: user.id } });
      if (!therapist || existingNote.therapistId !== therapist.id) {
        return res.forbidden('You can only update your own notes');
      }
    }

    const note = await prisma.therapistNote.update({
      where: { id },
      data: { isPinned: !existingNote.isPinned },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        therapist: {
          select: {
            id: true,
            userId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'THERAPIST_NOTE_UPDATED',
        entityType: 'TherapistNote',
        entityId: id,
        metadata: { updatedFields: ['isPinned'] },
      },
    });

    return res.ok(note);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
