import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    await requireAuth(req);
    const session = await prisma.videoSession.findUnique({
      where: { appointmentId: params.appointmentId },
      include: { appointment: true, therapist: { include: { user: true } } },
    });
    if (!session) return res.notFound('Video session not found');
    return res.ok(session);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function POST(req: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    await requireAuth(req);
    if (process.env.ENABLE_DAILY !== 'true') return res.badRequest('Video sessions are not enabled');

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: { therapist: true, client: true },
    });
    if (!appointment) return res.notFound('Appointment not found');

    const roomName = `appt-${params.appointmentId}`;
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: { enable_screenshare: true, enable_chat: true, enable_recording: false, enable_prejoin_ui: true, exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 },
      }),
    });
    const dailyRoom = await response.json();

    const session = await prisma.videoSession.create({
      data: {
        businessId: appointment.businessId,
        appointmentId: appointment.id,
        therapistId: appointment.therapistId,
        clientId: appointment.clientId,
        dailyRoomName: dailyRoom.name,
        dailyRoomUrl: dailyRoom.url,
        scheduledFor: appointment.startTime,
        status: 'SCHEDULED',
      },
      include: { appointment: true, therapist: { include: { user: true } } },
    });
    return res.created(session);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
