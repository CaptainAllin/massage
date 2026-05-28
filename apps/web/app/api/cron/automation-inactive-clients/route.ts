import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitAutomation } from '@/lib/automation';
import { res } from '@/lib/api-auth';

// Runs daily at 9am via Vercel Cron — fires CLIENT_INACTIVE for clients with no appointment in 30+ days
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return res.unauthorized('Invalid cron secret');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const inactiveClients = await prisma.client.findMany({
    where: {
      isActive: true,
      OR: [
        { lastVisitDate: { lt: thirtyDaysAgo } },
        { lastVisitDate: null, createdAt: { lt: thirtyDaysAgo } },
      ],
    },
    select: { id: true, businessId: true },
  });

  for (const client of inactiveClients) {
    emitAutomation('CLIENT_INACTIVE', client.businessId, {
      clientId: client.id,
      businessId: client.businessId,
    });
  }

  return res.ok({ processed: inactiveClients.length });
}
