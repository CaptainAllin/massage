import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const businessId = searchParams.get('businessId');

    if (!email) return res.badRequest('email is required');
    if (!businessId) return res.badRequest('businessId is required');

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        therapist: {
          select: { id: true, businessId: true },
        },
      },
    });

    if (!user) return res.notFound('No account found with that email address');

    return res.ok({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      hasTherapistProfile: !!user.therapist && user.therapist.businessId === businessId,
    });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
