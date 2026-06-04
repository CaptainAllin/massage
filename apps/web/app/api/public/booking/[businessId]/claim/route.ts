import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

// POST /api/public/booking/[businessId]/claim
// Links all guest Client records (matching the authenticated user's email) to their User account
export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return res.unauthorized();

    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.getUser(authHeader.substring(7));
    if (error || !data.user?.email) return res.unauthorized();

    const clients = await prisma.client.findMany({
      where: { businessId, email: data.user.email, userId: null },
      select: { id: true, firstName: true, lastName: true, appointments: { select: { id: true } } },
    });

    if (clients.length === 0) {
      const alreadyLinked = await prisma.client.findFirst({ where: { businessId, email: data.user.email } });
      if (alreadyLinked) return res.ok({ claimed: 0, message: 'Account already linked' });
      return res.notFound('No guest bookings found for this email at this business');
    }

    const userMeta = data.user.user_metadata ?? {};
    const updateData: Record<string, any> = { userId: data.user.id };
    if (userMeta.first_name) updateData.firstName = userMeta.first_name;
    if (userMeta.last_name) updateData.lastName = userMeta.last_name;

    await prisma.client.updateMany({ where: { businessId, email: data.user.email, userId: null }, data: updateData });

    const appointmentCount = clients.reduce((sum, c) => sum + c.appointments.length, 0);
    const clientId = clients[0].id;

    const existing = await prisma.loyaltyAccount.findUnique({
      where: { businessId_clientId: { businessId, clientId } },
    });

    if (!existing) {
      const bonusPoints = 100 + (appointmentCount > 0 ? 50 : 0);
      const account = await prisma.loyaltyAccount.create({
        data: { businessId, clientId, points: bonusPoints, lifetimePoints: bonusPoints, tier: 'BRONZE' },
      });
      const transactions = [
        { loyaltyAccountId: account.id, businessId, type: 'EARN', points: 100, description: 'Welcome bonus — account created' },
      ];
      if (appointmentCount > 0) {
        transactions.push({ loyaltyAccountId: account.id, businessId, type: 'EARN', points: 50, description: 'First booking bonus' });
      }
      await prisma.loyaltyTransaction.createMany({ data: transactions });
    }

    return res.ok({ claimed: clients.length, appointmentsClaimed: appointmentCount, message: `Linked ${clients.length} account(s)` });
  } catch (err) {
    console.error('[CLAIM]', err);
    return res.error();
  }
}
