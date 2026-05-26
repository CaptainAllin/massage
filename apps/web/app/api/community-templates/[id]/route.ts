import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Import a community template into my templates
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId } = body;

    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const community = await prisma.communityTemplate.findFirst({
      where: { id, status: 'APPROVED' },
    });
    if (!community) return res.notFound('Community template not found');

    const [imported] = await prisma.$transaction([
      prisma.noteTemplate.create({
        data: {
          businessId,
          name: community.name,
          category: community.category,
          fields: community.fields as any,
          isGlobal: false,
          createdBy: user.id,
        },
      }),
      prisma.communityTemplate.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      }),
    ]);

    return res.created(imported);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
