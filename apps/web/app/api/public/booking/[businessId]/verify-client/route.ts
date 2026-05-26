import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

// POST — check if a client exists by email or phone (for EXISTING_CLIENTS_ONLY mode)
export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const { email, phone } = await req.json();

    if (!email && !phone) {
      return res.badRequest('Provide email or phone to verify.');
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, bookingMode: true },
    });
    if (!business) return res.notFound('Business not found');

    const client = await prisma.client.findFirst({
      where: {
        businessId,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phoneNumber: phone }] : []),
        ],
      },
      select: { id: true, firstName: true, lastName: true },
    });

    return res.ok({ exists: !!client, clientName: client ? `${client.firstName} ${client.lastName}` : null });
  } catch (err) {
    console.error('[VERIFY CLIENT]', err);
    return res.error();
  }
}
