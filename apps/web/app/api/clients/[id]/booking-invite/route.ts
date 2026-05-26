import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, res, AuthError } from '@/lib/api-auth';

// POST — generate a booking invite link for a client
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id: clientId } = params;
    const { businessId, expiresInHours } = await req.json();

    if (!businessId) return res.badRequest('businessId is required');

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, name: true },
    });
    if (!business) return res.notFound('Business not found');
    if (business.ownerId !== user.id && user.role !== 'SUPER_ADMIN') {
      const therapist = await prisma.therapist.findFirst({ where: { userId: user.id, businessId } });
      if (!therapist) return res.forbidden('Access denied');
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, businessId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!client) return res.notFound('Client not found');

    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    const invite = await prisma.bookingInvite.create({
      data: { businessId, clientId, expiresAt },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const bookingUrl = `${baseUrl}/book/${businessId}?token=${invite.token}`;

    return res.created({ inviteId: invite.id, token: invite.token, bookingUrl, expiresAt });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[BOOKING INVITE POST]', err);
    return res.error();
  }
}

// GET — list existing invites for a client
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id: clientId } = params;
    const businessId = req.nextUrl.searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const invites = await prisma.bookingInvite.findMany({
      where: { clientId, businessId },
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const result = invites.map((inv) => ({
      ...inv,
      bookingUrl: `${baseUrl}/book/${businessId}?token=${inv.token}`,
      isExpired: inv.expiresAt ? inv.expiresAt < new Date() : false,
    }));

    return res.ok(result);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[BOOKING INVITE GET]', err);
    return res.error();
  }
}
