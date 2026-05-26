import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WaitlistStatus } from '@prisma/client';

// POST — public: join waitlist (no auth required, for booking page)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, firstName, lastName, email, phoneNumber, serviceType, therapistId, preferredDates, preferredTimes, notes } = body;

    if (!businessId || (!email && !phoneNumber) || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'businessId, firstName, lastName, and email or phone are required' },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

    // Find or create client record
    let client = await prisma.client.findFirst({
      where: {
        businessId,
        OR: [
          email ? { email } : {},
          phoneNumber ? { phoneNumber } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: { businessId, firstName, lastName, email: email || null, phoneNumber: phoneNumber || null },
      });
    }

    // Check if already on waitlist
    const existing = await prisma.waitlist.findFirst({
      where: { businessId, clientId: client.id, status: WaitlistStatus.WAITING },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, message: 'Already on waitlist' });
    }

    const entry = await prisma.waitlist.create({
      data: {
        businessId,
        clientId: client.id,
        therapistId: therapistId || null,
        serviceType: serviceType || null,
        preferredDates: preferredDates || [],
        preferredTimes: preferredTimes || [],
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: entry, message: 'Added to waitlist' }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
