import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const session = await prisma.videoSession.findUnique({ where: { id: params.id } });
    if (!session) return res.notFound('Session not found');

    const endedAt = new Date();
    const durationMinutes = session.startedAt ? Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000) : null;
    const updated = await prisma.videoSession.update({
      where: { id: params.id },
      data: { status: 'ENDED', endedAt, durationMinutes } as any,
    });
    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
