import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const category = searchParams.get('category');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const where: any = {
      isArchived: includeArchived ? undefined : false,
      OR: [{ isGlobal: true }, { businessId }],
    };

    if (category) where.category = category;

    const templates = await prisma.noteTemplate.findMany({
      where,
      orderBy: [{ isGlobal: 'desc' }, { createdAt: 'asc' }],
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
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, name, category, fields } = body;

    if (!businessId) return res.badRequest('businessId is required');
    if (!name?.trim()) return res.badRequest('name is required');
    if (!category) return res.badRequest('category is required');
    if (!Array.isArray(fields)) return res.badRequest('fields must be an array');

    await requireBusinessAccess(user, businessId);

    const template = await prisma.noteTemplate.create({
      data: {
        businessId,
        name: name.trim(),
        category,
        fields,
        isGlobal: false,
        createdBy: user.id,
      },
    });

    return res.created(template);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
