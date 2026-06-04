import { NextRequest } from 'next/server';
import { requireAuth, requireBusinessRole, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { sendStaffInviteEmail } from '@/lib/email';
import crypto from 'crypto';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    await requireBusinessRole(user, businessId, ['OWNER']);

    const invites = await prisma.staffInvite.findMany({
      where: { businessId, acceptedAt: null },
      include: {
        sentByUser: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.ok(invites);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API staff-invites GET]', err);
    return res.error();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, email, role } = body;

    if (!businessId || !email || !role) return res.badRequest('businessId, email, and role are required');

    const validRoles = ['THERAPIST', 'SENIOR_THERAPIST', 'RECEPTIONIST'];
    if (!validRoles.includes(role)) return res.badRequest('Invalid role');

    await requireBusinessRole(user, businessId, ['OWNER']);

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });
    if (!business) return res.notFound('Business not found');

    // Check if there's already an active member with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      const existingMember = await prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: existingUser.id, businessId } },
      });
      if (existingMember && existingMember.status === 'ACTIVE') {
        return res.badRequest('This person is already a member of your business');
      }
    }

    // Cancel any existing pending invites for this email+business
    await prisma.staffInvite.updateMany({
      where: { businessId, email: email.toLowerCase().trim(), acceptedAt: null },
      data: { expiresAt: new Date() }, // expire them
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.staffInvite.create({
      data: {
        businessId,
        email: email.toLowerCase().trim(),
        role,
        token,
        expiresAt,
        sentBy: user.id,
      },
    });

    const inviterUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true },
    });
    const inviterName = inviterUser ? `${inviterUser.firstName} ${inviterUser.lastName}`.trim() : 'Your practice';

    const inviteUrl = `${APP_URL}/accept-invite?token=${token}`;

    await sendStaffInviteEmail({
      to: email,
      businessName: business.name,
      inviterName,
      role,
      inviteUrl,
      expiresAt,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'STAFF_INVITE_SENT',
        entityType: 'StaffInvite',
        entityId: invite.id,
        metadata: { email, role },
      },
    });

    return res.created(invite);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API staff-invites POST]', err);
    return res.error();
  }
}
