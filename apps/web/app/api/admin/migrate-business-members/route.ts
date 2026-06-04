import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

/**
 * POST /api/admin/migrate-business-members
 *
 * 7.4.5 — Data migration: for every existing Therapist record that lacks a
 * matching BusinessMember entry, create one with role THERAPIST.
 * Also ensures every business owner has an OWNER BusinessMember record.
 *
 * Restricted to SUPER_ADMIN only. Safe to run multiple times (idempotent).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (user.role !== 'SUPER_ADMIN') return res.forbidden('SUPER_ADMIN only');

    const results = { therapistsMigrated: 0, ownersMigrated: 0, skipped: 0 };

    // 1. Migrate therapist records → BusinessMember(THERAPIST)
    const therapists = await prisma.therapist.findMany({
      select: { id: true, userId: true, businessId: true },
    });

    for (const t of therapists) {
      const existing = await prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: t.userId, businessId: t.businessId } },
      });
      if (existing) {
        results.skipped++;
        continue;
      }
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
      select: { id: true, ownerId: true },
    });

    for (const b of businesses) {
      const existing = await prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: b.ownerId, businessId: b.id } },
      });
      if (existing) {
        results.skipped++;
        continue;
      }
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
        entityId: 'migration',
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
