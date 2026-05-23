import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) return res.notFound('User not found');

    return res.ok(fullUser);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const data = await req.json();

    // Prevent privilege escalation
    const { id, authUserId, role, ...safeData } = data;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: safeData,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_PROFILE_UPDATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { updatedFields: Object.keys(safeData) },
      },
    });

    return res.ok(updatedUser);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
