import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessAccess, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    await requireBusinessAccess(user, businessId);

    const members = await prisma.businessMember.findMany({
      where: { businessId, status: { not: 'INACTIVE' } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return res.ok(members);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API business-members GET]', err);
    return res.error();
  }
}
