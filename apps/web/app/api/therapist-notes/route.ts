import { requireAuth, requireBusinessAccess, getBusinessRole, res, AuthError } from '@/lib/api-auth';
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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const clientId = searchParams.get('clientId');
    const isPinnedParam = searchParams.get('isPinned');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { businessId };

    // RBAC: Therapists (global role or per-business role) can only see their own notes
    const businessRole = await getBusinessRole(user.id, businessId);
    if (user.role === 'THERAPIST' || businessRole === 'THERAPIST') {
      const therapist = await prisma.therapist.findFirst({ where: { userId: user.id, businessId } });
      if (therapist) where.therapistId = therapist.id;
    }

    if (clientId) where.clientId = clientId;
    if (isPinnedParam !== null) where.isPinned = isPinnedParam === 'true';

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      prisma.therapistNote.findMany({
        where,
        include: noteInclude,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.therapistNote.count({ where }),
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
    const { businessId, clientId, therapistId, content, isPinned } = body;

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);
    if (!clientId) return res.badRequest('clientId is required');
    if (!therapistId) return res.badRequest('therapistId is required');
    if (!content) return res.badRequest('content is required');

    const note = await prisma.therapistNote.create({
      data: {
        businessId,
        clientId,
        therapistId,
        content,
        isPinned: isPinned || false,
      },
      include: noteInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'THERAPIST_NOTE_CREATED',
        entityType: 'TherapistNote',
        entityId: note.id,
        metadata: { clientId },
      },
    });

    return res.created(note);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
