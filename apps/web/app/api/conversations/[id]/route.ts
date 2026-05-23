import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) return res.badRequest('businessId is required');

    const conversation = await prisma.conversation.findFirst({
      where: { id, businessId },
      include: {
        client: true,
        _count: { select: { messages: true } },
      },
    });

    if (!conversation) return res.notFound('Conversation not found');

    return res.ok(conversation);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { businessId, ...data } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: { client: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'CONVERSATION_UPDATED',
        entityType: 'Conversation',
        entityId: id,
        metadata: data,
      },
    });

    return res.ok(conversation);
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    console.error('[API]', err);
    return res.error();
  }
}
