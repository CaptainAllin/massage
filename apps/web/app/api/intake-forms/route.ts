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
    const templateId = searchParams.get('templateId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = { businessId };
    if (clientId) where.clientId = clientId;
    if (templateId) where.templateId = templateId;
    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) where.submittedAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [intakeForms, total] = await Promise.all([
      prisma.intakeForm.findMany({
        where,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          template: { select: { id: true, name: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.intakeForm.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: intakeForms,
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
    const { businessId, clientId, templateId, formData } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!clientId) return res.badRequest('clientId is required');
    if (!formData) return res.badRequest('formData is required');

    const intakeForm = await prisma.intakeForm.create({
      data: { businessId, clientId, templateId, formData },
      include: { client: true, template: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'INTAKE_FORM_SUBMITTED',
        entityType: 'IntakeForm',
        entityId: intakeForm.id,
        metadata: { clientId },
      },
    });

    return res.created(intakeForm);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
