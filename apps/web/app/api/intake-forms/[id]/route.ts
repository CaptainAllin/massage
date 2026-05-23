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

    const intakeForm = await prisma.intakeForm.findFirst({
      where: { id, businessId },
      include: { client: true, template: true },
    });

    if (!intakeForm) return res.notFound('Intake form not found');

    return res.ok(intakeForm);
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
    const { businessId, formData } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.intakeForm.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Intake form not found');

    const intakeForm = await prisma.intakeForm.update({
      where: { id },
      data: { formData },
      include: { client: true, template: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'INTAKE_FORM_UPDATED',
        entityType: 'IntakeForm',
        entityId: id,
      },
    });

    return res.ok(intakeForm);
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

    const existing = await prisma.intakeForm.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Intake form not found');

    const intakeForm = await prisma.intakeForm.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'INTAKE_FORM_DELETED',
        entityType: 'IntakeForm',
        entityId: id,
      },
    });

    return res.ok(intakeForm);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
