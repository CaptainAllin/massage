import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const where: any = { businessId };
  const clientId = searchParams.get('clientId');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const conversationId = searchParams.get('conversationId');

  if (clientId) where.recipientId = clientId;
  if (type) where.type = type;
  if (status) where.status = status;
  if (conversationId) where.conversationId = conversationId;

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: parseInt(searchParams.get('limit') || '50', 10),
  });

  return res.ok(messages);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, recipientId, type, content, subject, scheduledFor, metadata, senderType } = body;

  if (!businessId || !recipientId || !type || !content) {
    return res.badRequest('businessId, recipientId, type, content are required');
  }

  const recipient = await prisma.client.findFirst({ where: { id: recipientId, businessId } });
  if (!recipient) return res.notFound('Recipient not found');

  const message = await prisma.message.create({
    data: {
      businessId,
      senderId: user.id,
      senderType: senderType || 'USER',
      recipientId,
      recipientType: 'CLIENT',
      type,
      subject,
      content,
      status: 'PENDING',
      direction: 'OUTBOUND',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      metadata,
    },
  });

  // Update or create conversation
  const existingConversation = await prisma.conversation.findFirst({
    where: { businessId, clientId: recipientId, type },
  });

  if (existingConversation) {
    await prisma.conversation.update({
      where: { id: existingConversation.id },
      data: { lastMessageAt: new Date(), lastMessagePreview: content.substring(0, 100) },
    });
  } else {
    await prisma.conversation.create({
      data: {
        businessId,
        clientId: recipientId,
        type,
        subject,
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 100),
      },
    });
  }

  // Send via Twilio REST API if enabled
  if (process.env.ENABLE_TWILIO === 'true' && type === 'SMS' && recipient.phoneNumber && !scheduledFor) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ Body: content, From: process.env.TWILIO_FROM_NUMBER!, To: recipient.phoneNumber }),
        }
      );
      if (twilioRes.ok) {
        await prisma.message.update({ where: { id: message.id }, data: { status: 'SENT', sentAt: new Date() } as any });
      } else {
        throw new Error(`Twilio returned ${twilioRes.status}`);
      }
    } catch (err: any) {
      console.error('[Twilio]', err.message);
      await prisma.message.update({ where: { id: message.id }, data: { status: 'FAILED' } });
    }
  }

  return res.created(message);
});
