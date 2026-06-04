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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await resolveClient(req);
    if (!client) return res.unauthorized();

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      select: { id: true, clientId: true, startTime: true, status: true },
    });

    if (!appointment) return res.notFound('Appointment not found');
    if (appointment.clientId !== client.id) return res.forbidden();
    if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
      return res.badRequest('This appointment cannot be cancelled');
    }
    if (appointment.startTime <= new Date()) {
      return res.badRequest('Cannot cancel an appointment that has already started');
    }

    await prisma.appointment.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    });

    return res.ok({ message: 'Appointment cancelled' });
  } catch (err) {
    console.error('[CLIENT PORTAL CANCEL]', err);
    return res.error();
  }
}
