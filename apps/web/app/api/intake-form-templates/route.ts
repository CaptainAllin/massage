import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const isActive = searchParams.get('isActive');
    const where: any = { businessId };
    if (isActive !== null) where.isActive = isActive === 'true';

    const templates = await prisma.intakeFormTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return res.ok(templates);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { businessId, name, description, fields, isDefault } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!name) return res.badRequest('name is required');
    if (!fields || !Array.isArray(fields)) return res.badRequest('fields must be an array');

    if (isDefault) {
      await prisma.intakeFormTemplate.updateMany({
        where: { businessId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.intakeFormTemplate.create({
      data: { businessId, name, description, fields, isDefault: !!isDefault },
    });

    return res.created(template);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
