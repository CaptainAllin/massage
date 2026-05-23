import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const membership = await prisma.membership.findFirst({
      where: { id: params.id, businessId },
      include: { membershipSessions: true },
    });
    if (!membership) return res.notFound('Membership not found');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sessionsUsedThisMonth = membership.membershipSessions.filter(
      (s: any) => s.redeemedAt >= monthStart
    ).length;
    const remaining = Math.max(0, (membership.sessionsPerMonth || 0) - sessionsUsedThisMonth);

    return res.ok({ remaining, sessionsPerMonth: membership.sessionsPerMonth, sessionsUsedThisMonth });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
