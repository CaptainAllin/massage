import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const clientId = searchParams.get('clientId');
    const appointmentId = searchParams.get('appointmentId');
    const treatmentNoteId = searchParams.get('treatmentNoteId');
    const view = searchParams.get('view');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { businessId };
    if (clientId) where.clientId = clientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (treatmentNoteId) where.treatmentNoteId = treatmentNoteId;
    if (view) where.view = view;

    const skip = (page - 1) * limit;
    const [bodyMaps, total] = await Promise.all([
      prisma.bodyMap.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bodyMap.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: bodyMaps,
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
    const { businessId, clientId, appointmentId, treatmentNoteId, view, regions, notes } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!clientId) return res.badRequest('clientId is required');
    if (!view) return res.badRequest('view is required');
    if (!regions) return res.badRequest('regions is required');

    const bodyMap = await prisma.bodyMap.create({
      data: { businessId, clientId, appointmentId, treatmentNoteId, view, regions, notes },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'BODY_MAP_CREATED',
        entityType: 'BodyMap',
        entityId: bodyMap.id,
        metadata: { clientId },
      },
    });

    return res.created(bodyMap);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
