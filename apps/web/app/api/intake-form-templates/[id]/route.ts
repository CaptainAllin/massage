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

    const template = await prisma.intakeFormTemplate.findFirst({
      where: { id, businessId },
    });

    if (!template) return res.notFound('Template not found');

    return res.ok(template);
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
    await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, name, description, fields, isActive, isDefault } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.intakeFormTemplate.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Template not found');

    if (isDefault) {
      await prisma.intakeFormTemplate.updateMany({
        where: { businessId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const template = await prisma.intakeFormTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(fields !== undefined && { fields }),
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return res.ok(template);
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
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.intakeFormTemplate.findFirst({ where: { id, businessId } });
    if (!existing) return res.notFound('Template not found');

    await prisma.intakeFormTemplate.delete({ where: { id } });

    return res.ok({ id });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
