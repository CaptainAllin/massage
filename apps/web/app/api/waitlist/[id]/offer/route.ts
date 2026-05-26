import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { WaitlistStatus } from '@prisma/client';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, offerExpiryHours = 24 } = body;
    if (!businessId) return res.badRequest('businessId is required');

    const entry = await prisma.waitlist.findFirst({
      where: { id: params.id, businessId },
      include: {
        client: true,
        business: { select: { name: true } },
      },
    });
    if (!entry) return res.notFound('Waitlist entry not found');
    if (entry.status !== WaitlistStatus.WAITING) {
      return res.badRequest('Can only offer slots to clients with WAITING status');
    }

    const offerToken = crypto.randomBytes(32).toString('hex');
    const offerExpiresAt = new Date(Date.now() + offerExpiryHours * 60 * 60 * 1000);

    const updated = await prisma.waitlist.update({
      where: { id: params.id },
      data: {
        status: WaitlistStatus.OFFERED,
        offerToken,
        offerExpiresAt,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
        therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/book/${businessId}?waitlistToken=${offerToken}`;

    // Send notification message to client
    if (entry.client.phoneNumber || entry.client.email) {
      const expiryStr = new Date(offerExpiresAt).toLocaleString('en-AU', {
        weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
      });
      const serviceText = entry.serviceType ? ` for ${entry.serviceType}` : '';
      const content = `Hi ${entry.client.firstName}, a slot has opened up${serviceText} at ${entry.business.name}! Book now (link expires ${expiryStr}): ${bookingLink}`;

      await prisma.message.create({
        data: {
          businessId,
          senderId: user.id,
          senderType: 'USER',
          recipientId: entry.clientId,
          recipientType: 'CLIENT',
          type: entry.client.phoneNumber ? 'SMS' : 'EMAIL',
          subject: 'A slot has opened up!',
          content,
          status: 'PENDING',
          direction: 'OUTBOUND',
          metadata: { waitlistEntryId: params.id, offerToken },
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'WAITLIST_SLOT_OFFERED',
        entityType: 'Waitlist',
        entityId: params.id,
        metadata: { clientId: entry.clientId, offerExpiryHours, offerToken },
      },
    });

    return res.ok({ ...updated, bookingLink }, 'Slot offer sent to client');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
