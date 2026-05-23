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
      include: { client: true, membershipSessions: { orderBy: { redeemedAt: 'desc' } } },
    });
    if (!membership) return res.notFound('Membership not found');
    return res.ok(membership);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { businessId, ...data } = body;
    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.membership.findFirst({ where: { id: params.id, businessId } });
    if (!existing) return res.notFound('Membership not found');

    const updated = await prisma.membership.update({ where: { id: params.id }, data, include: { client: true } });
    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
