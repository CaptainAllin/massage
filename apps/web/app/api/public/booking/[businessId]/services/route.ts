import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) return res.notFound('Business not found');

    const services = await prisma.service.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, duration: true, price: true, color: true },
    });

    return res.ok(services);
  } catch (err) {
    console.error('[PUBLIC SERVICES GET]', err);
    return res.error();
  }
}
