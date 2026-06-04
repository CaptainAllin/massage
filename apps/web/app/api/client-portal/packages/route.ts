import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

async function resolveClient(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(authHeader.substring(7));
  if (error || !data.user) return null;
  return prisma.client.findFirst({ where: { email: data.user.email } });
}

export async function GET(req: NextRequest) {
  const client = await resolveClient(req);
  if (!client) return res.unauthorized();

  const [memberships, packages] = await Promise.all([
    prisma.membership.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, description: true, price: true, currency: true,
        sessionsPerMonth: true, sessionsUsed: true, rolledOverSessions: true,
        status: true, billingCycleStart: true, billingCycleEnd: true,
        nextBillingDate: true, startDate: true, endDate: true,
      },
    }),
    prisma.packagePurchase.findMany({
      where: { clientId: client.id },
      orderBy: { purchasedAt: 'desc' },
      select: {
        id: true, name: true, description: true, totalSessions: true,
        sessionsUsed: true, totalPrice: true, currency: true,
        status: true, expirationDate: true, purchasedAt: true,
      },
    }),
  ]);

  return res.ok({ memberships, packages });
}
