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

  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get('upcoming') !== 'false';

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: client.id,
      ...(upcoming
        ? { startTime: { gte: new Date() }, status: { in: ['SCHEDULED', 'CONFIRMED'] } }
        : { startTime: { lt: new Date() } }),
    },
    orderBy: { startTime: upcoming ? 'asc' : 'desc' },
    take: 50,
    include: {
      therapist: { include: { user: { select: { firstName: true, lastName: true } } } },
      location: { select: { name: true, address: true, city: true } },
    },
  });

  return res.ok(appointments);
}
