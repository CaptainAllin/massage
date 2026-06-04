import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const DEFAULT_PREFS = {
  leaveDecision: true,  // email when leave is approved/declined
  teamJoined: true,     // email when you join a new business
  newBooking: true,     // email when a new appointment is assigned to you
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationPrefs: true },
    });
    const prefs = { ...DEFAULT_PREFS, ...(fullUser?.notificationPrefs as Record<string, boolean> ?? {}) };
    return res.ok(prefs);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationPrefs: true },
    });
    const current = { ...DEFAULT_PREFS, ...(fullUser?.notificationPrefs as Record<string, boolean> ?? {}) };

    const allowed = Object.keys(DEFAULT_PREFS);
    const updates: Record<string, boolean> = {};
    for (const key of allowed) {
      if (typeof body[key] === 'boolean') updates[key] = body[key];
    }

    const merged = { ...current, ...updates };

    await prisma.user.update({
      where: { id: user.id },
      data: { notificationPrefs: merged },
    });

    return res.ok(merged);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
