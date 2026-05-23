import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, recipientIds, type, content, subject, scheduledFor } = body;

  if (!businessId || !recipientIds?.length || !type || !content) {
    return res.badRequest('businessId, recipientIds, type, content are required');
  }

  const results = { success: [] as any[], failed: [] as any[] };

  for (const recipientId of recipientIds) {
    try {
      const recipient = await prisma.client.findFirst({ where: { id: recipientId, businessId } });
      if (!recipient) { results.failed.push({ recipientId, error: 'Not found' }); continue; }

      const message = await prisma.message.create({
        data: {
          businessId,
          senderId: user.id,
          senderType: 'USER',
          recipientId,
          recipientType: 'CLIENT',
          type,
          subject,
          content,
          status: 'PENDING',
          direction: 'OUTBOUND',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        },
      });
      results.success.push(message);
    } catch (err: any) {
      results.failed.push({ recipientId, error: err.message });
    }
  }

  return res.ok(results);
});
