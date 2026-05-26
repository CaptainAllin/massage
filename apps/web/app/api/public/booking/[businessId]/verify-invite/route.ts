import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

// GET — validate an invite token and return pre-filled client details
export async function GET(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const token = req.nextUrl.searchParams.get('token');

    if (!token) return res.badRequest('token is required');

    const invite = await prisma.bookingInvite.findUnique({
      where: { token },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
      },
    });

    if (!invite || invite.businessId !== businessId) {
      return res.notFound('Invalid invitation link.');
    }
    if (invite.usedAt) {
      return res.badRequest('This invitation has already been used.');
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.badRequest('This invitation has expired.');
    }

    return res.ok({
      valid: true,
      client: {
        firstName: invite.client.firstName,
        lastName: invite.client.lastName,
        email: invite.client.email,
        phone: invite.client.phoneNumber,
      },
    });
  } catch (err) {
    console.error('[VERIFY INVITE]', err);
    return res.error();
  }
}
