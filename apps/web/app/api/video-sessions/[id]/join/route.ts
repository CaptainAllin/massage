import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const session = await prisma.videoSession.findUnique({
      where: { id: params.id },
      include: { therapist: true, client: { include: { user: true } } },
    });
    if (!session) return res.notFound('Session not found');

    const isTherapist = session.therapist.userId === user.id;
    const isClient = (session.client as any)?.user?.id === user.id;
    if (!isTherapist && !isClient) return res.forbidden('You cannot join this session');

    return res.ok({ url: session.dailyRoomUrl, sessionId: session.id, role: isTherapist ? 'therapist' : 'client' });
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
