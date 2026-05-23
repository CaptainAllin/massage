import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const condition = await prisma.medicalCondition.findFirst({
      where: { id, businessId },
      include: { client: true },
    });

    if (!condition) return res.notFound('Medical condition not found');

    return res.ok(condition);
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

    const existing = await prisma.medicalCondition.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Medical condition not found');

    // If status is being changed to "resolved", set resolvedAt
    if (data.status === 'resolved' && !data.resolvedAt) {
      data.resolvedAt = new Date();
    }
    if (data.diagnosisDate) {
      data.diagnosisDate = new Date(data.diagnosisDate);
    }

    const condition = await prisma.medicalCondition.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'MEDICAL_CONDITION_UPDATED',
        entityType: 'MedicalCondition',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return res.ok(condition);
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

    const existing = await prisma.medicalCondition.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Medical condition not found');

    const condition = await prisma.medicalCondition.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'MEDICAL_CONDITION_DELETED',
        entityType: 'MedicalCondition',
        entityId: id,
      },
    });

    return res.ok(condition);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
