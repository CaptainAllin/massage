import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const businessId = body.businessId || new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const membership = await prisma.membership.findFirst({ where: { id: params.id, businessId } });
    if (!membership) return res.notFound('Membership not found');
    if (membership.status !== 'ACTIVE') return res.badRequest('Membership is not active');

    const session = await prisma.membershipSession.create({
      data: { membershipId: params.id, redeemedAt: new Date(), appointmentId: body.appointmentId || null, businessId: '' } as any,
    });
    return res.created(session, 'Session redeemed');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
