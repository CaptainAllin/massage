import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Browse approved community templates
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

    const where: any = { status: 'APPROVED' };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.communityTemplate.findMany({
        where,
        orderBy: { usageCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityTemplate.count({ where }),
    ]);

    return res.ok({ templates, total, page, limit });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

// Submit a template to the community library
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, templateId, description } = body;

    if (!templateId) return res.badRequest('templateId is required');
    if (businessId) await requireBusinessAccess(user, businessId);

    const source = await prisma.noteTemplate.findFirst({
      where: { id: templateId, ...(businessId ? { businessId } : { isGlobal: true }) },
    });
    if (!source) return res.notFound('Template not found');

    // Prevent duplicate submissions of the same template
    const existing = await prisma.communityTemplate.findFirst({
      where: { submittedByUserId: user.id, name: source.name, status: { not: 'REJECTED' } },
    });
    if (existing) return res.badRequest('You have already submitted a template with this name');

    const community = await prisma.communityTemplate.create({
      data: {
        name: source.name,
        category: source.category,
        fields: source.fields as any,
        description: description?.trim() || null,
        submittedByUserId: user.id,
        submittedByBusinessId: businessId || null,
      },
    });

    return res.created(community);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
