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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { businessId };
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [conditions, total] = await Promise.all([
      prisma.medicalCondition.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.medicalCondition.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: conditions,
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
    const { businessId, clientId, name, diagnosisDate, status, severity, notes, treatmentPlan } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!clientId) return res.badRequest('clientId is required');
    if (!name) return res.badRequest('name is required');

    const condition = await prisma.medicalCondition.create({
      data: {
        businessId,
        clientId,
        name,
        diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : undefined,
        status: status || 'active',
        severity,
        notes,
        treatmentPlan,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'MEDICAL_CONDITION_CREATED',
        entityType: 'MedicalCondition',
        entityId: condition.id,
        metadata: { clientId, name },
      },
    });

    return res.created(condition);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
