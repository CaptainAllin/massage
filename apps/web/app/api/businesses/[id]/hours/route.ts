import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireBusinessRole, res } from '@/lib/api-auth';

// GET — return business hours for all 7 days (creates defaults if none exist)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id: businessId } = params;
    await requireBusinessRole(user, businessId, ['OWNER', 'SENIOR_THERAPIST', 'THERAPIST', 'RECEPTIONIST']);

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId') || null;

    const hours = await prisma.businessHours.findMany({
      where: { businessId, locationId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Return defaults if none configured yet (Mon–Fri 9–5, Sat–Sun closed)
    if (hours.length === 0) {
      const defaults = Array.from({ length: 7 }, (_, i) => ({
        id: null,
        businessId,
        locationId,
        dayOfWeek: i,
        openTime: i >= 1 && i <= 5 ? '09:00' : '09:00',
        closeTime: i >= 1 && i <= 5 ? '17:00' : '17:00',
        isClosed: i === 0 || i === 6, // Sun & Sat closed by default
      }));
      return res.ok(defaults);
    }

    return res.ok(hours);
  } catch (err: any) {
    if (err.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[BUSINESS HOURS GET]', err);
    return res.error();
  }
}

// PUT — upsert all 7 days at once
// Body: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean; locationId?: string }>
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id: businessId } = params;
    await requireBusinessRole(user, businessId, ['OWNER']);

    const body = await req.json();
    const days: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean; locationId?: string | null }[] = body;

    if (!Array.isArray(days) || days.length === 0) {
      return res.badRequest('days array is required');
    }

    const results = await Promise.all(
      days.map(async (d) => {
        const locationId = d.locationId ?? null;
        const existing = await prisma.businessHours.findFirst({
          where: { businessId, locationId, dayOfWeek: d.dayOfWeek },
        });
        if (existing) {
          return prisma.businessHours.update({
            where: { id: existing.id },
            data: { openTime: d.openTime, closeTime: d.closeTime, isClosed: d.isClosed },
          });
        }
        return prisma.businessHours.create({
          data: { businessId, locationId, dayOfWeek: d.dayOfWeek, openTime: d.openTime, closeTime: d.closeTime, isClosed: d.isClosed },
        });
      })
    );

    return res.ok(results);
  } catch (err: any) {
    if (err.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[BUSINESS HOURS PUT]', err);
    return res.error();
  }
}
