import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { seedDefaultAutomationRules } from '@/lib/automation';
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

    // Return all businesses the user owns or is a member of
    const [ownedBusinesses, memberBusinesses, therapistBusiness] = await Promise.all([
      prisma.business.findMany({ where: { ownerId: user.id } }),
      prisma.businessMember.findMany({
        where: { userId: user.id, status: { not: 'INACTIVE' } },
        include: { business: true },
      }),
      prisma.therapist.findFirst({
        where: { userId: user.id },
        include: { business: true },
      }),
    ]);

    const seen = new Set<string>();
    const businesses: any[] = [];
    for (const b of ownedBusinesses) {
      if (!seen.has(b.id)) { seen.add(b.id); businesses.push(b); }
    }
    for (const m of memberBusinesses) {
      if (!seen.has(m.business.id)) { seen.add(m.business.id); businesses.push(m.business); }
    }
    if (therapistBusiness && !seen.has(therapistBusiness.business.id)) {
      businesses.push(therapistBusiness.business);
    }

    return Response.json({ success: true, data: businesses });
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

    // Create the owner's BusinessMember record so per-business role checks work
    await prisma.businessMember.create({
      data: {
        userId: user.id,
        businessId: business.id,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
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

    seedDefaultAutomationRules(business.id).catch((err) =>
      console.error('[automation] seedDefaultAutomationRules error:', err),
    );

    return res.created(business);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
