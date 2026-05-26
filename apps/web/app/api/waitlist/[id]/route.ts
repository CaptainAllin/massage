import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { WaitlistStatus } from '@prisma/client';
import crypto from 'crypto';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const entry = await prisma.waitlist.findFirst({
      where: { id: params.id, businessId },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
        therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!entry) return res.notFound('Waitlist entry not found');
    return res.ok(entry);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, status, offerExpiryHours } = body;
    if (!businessId) return res.badRequest('businessId is required');

    const entry = await prisma.waitlist.findFirst({ where: { id: params.id, businessId } });
    if (!entry) return res.notFound('Waitlist entry not found');

    const updateData: any = {};

    if (status) {
      updateData.status = status as WaitlistStatus;
      if (status === WaitlistStatus.OFFERED) {
        updateData.offerToken = crypto.randomBytes(32).toString('hex');
        const hours = offerExpiryHours ?? 24;
        updateData.offerExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
    }

    const updated = await prisma.waitlist.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
        therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'WAITLIST_UPDATED',
        entityType: 'Waitlist',
        entityId: params.id,
        metadata: { status, offerExpiryHours },
      },
    });

    return res.ok(updated, 'Waitlist entry updated');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const entry = await prisma.waitlist.findFirst({ where: { id: params.id, businessId } });
    if (!entry) return res.notFound('Waitlist entry not found');

    await prisma.waitlist.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'WAITLIST_REMOVED',
        entityType: 'Waitlist',
        entityId: params.id,
        metadata: { clientId: entry.clientId },
      },
    });

    return res.ok(null, 'Removed from waitlist');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
