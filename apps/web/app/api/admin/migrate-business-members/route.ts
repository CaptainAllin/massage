import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

/**
 * POST /api/admin/migrate-business-members
 *
 * Backfills missing BusinessMember records for therapists and owners.
 * - SUPER_ADMIN: runs across all businesses
 * - Business owner: runs only for their own business (pass ?businessId=)
 *
 * Safe to run multiple times (idempotent).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const requestedBusinessId = searchParams.get('businessId');

    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    // Business owners may only migrate their own business
    if (!isSuperAdmin) {
      if (!requestedBusinessId) return res.badRequest('businessId is required');
      const business = await prisma.business.findUnique({
        where: { id: requestedBusinessId },
        select: { ownerId: true },
      });
      if (!business) return res.notFound('Business not found');
      if (business.ownerId !== user.id) return res.forbidden('You can only migrate your own business');
    }

    const results = { therapistsMigrated: 0, ownersMigrated: 0, skipped: 0 };

    // 1. Migrate therapist records → BusinessMember(THERAPIST)
    const therapists = await prisma.therapist.findMany({
      where: isSuperAdmin ? undefined : { businessId: requestedBusinessId! },
      select: { id: true, userId: true, businessId: true },
    });

    for (const t of therapists) {
      const existing = await prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: t.userId, businessId: t.businessId } },
      });
      if (existing) { results.skipped++; continue; }
      await prisma.businessMember.create({
        data: {
          userId: t.userId,
          businessId: t.businessId,
          role: 'THERAPIST',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });
      results.therapistsMigrated++;
    }

    // 2. Migrate business owners → BusinessMember(OWNER)
    const businesses = await prisma.business.findMany({
      where: isSuperAdmin ? undefined : { id: requestedBusinessId! },
      select: { id: true, ownerId: true },
    });

    for (const b of businesses) {
      const existing = await prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: b.ownerId, businessId: b.id } },
      });
      if (existing) { results.skipped++; continue; }
      await prisma.businessMember.create({
        data: {
          userId: b.ownerId,
          businessId: b.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });
      results.ownersMigrated++;
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BUSINESS_MEMBER_MIGRATION',
        entityType: 'System',
        entityId: requestedBusinessId ?? 'all',
        metadata: results,
      },
    });

    return res.ok({ message: 'Migration complete', ...results });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[MIGRATION]', err);
    return res.error();
  }
}
