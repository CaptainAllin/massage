import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || body.businessId;

    if (!businessId) return res.badRequest('businessId is required');

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { status: 'ARCHIVED', updatedAt: new Date() },
      include: { client: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'CONVERSATION_UPDATED',
        entityType: 'Conversation',
        entityId: id,
        metadata: { status: 'ARCHIVED' },
      },
    });

    return res.ok(conversation);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
