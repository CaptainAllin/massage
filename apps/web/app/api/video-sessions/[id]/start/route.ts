import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const session = await prisma.videoSession.findUnique({ where: { id: params.id } });
    if (!session) return res.notFound('Session not found');

    const updated = await prisma.videoSession.update({ where: { id: params.id }, data: { status: 'ACTIVE', startedAt: new Date() } });
    return res.ok(updated);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
