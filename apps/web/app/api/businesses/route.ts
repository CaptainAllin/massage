import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const ownerSelect = {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    };

    // Super admins can see all businesses
    if (user.role === 'SUPER_ADMIN') {
      const businesses = await prisma.business.findMany({
        include: { owner: ownerSelect },
      });
      return Response.json({ success: true, data: businesses });
    }

    // Business owners see their own business
    if (user.role === 'BUSINESS_OWNER') {
      const businesses = await prisma.business.findMany({
        where: { ownerId: user.id },
      });
      return Response.json({ success: true, data: businesses });
    }

    // Other roles see businesses they're associated with
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        therapist: { include: { business: true } },
      },
    });

    if ((fullUser as any)?.therapist) {
      return Response.json({ success: true, data: [(fullUser as any).therapist.business] });
    }

    return Response.json({ success: true, data: [] });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const data = await req.json();

    // Check if user already owns a business
    const existingBusiness = await prisma.business.findUnique({
      where: { ownerId: user.id },
    });

    if (existingBusiness) {
      return res.forbidden('User already owns a business');
    }

    const { ownerId, ...rest } = data;

    const business = await prisma.business.create({
      data: {
        ...rest,
        ownerId: user.id,
      } as any,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId: business.id,
        action: 'BUSINESS_CREATED',
        entityType: 'Business',
        entityId: business.id,
      },
    });

    return res.created(business);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
