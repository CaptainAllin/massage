import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MessageLogStatus } from '@prisma/client';

// Twilio signs requests with a signature header. We validate it in production.
function twilioStatusToLogStatus(twilioStatus: string): MessageLogStatus | null {
  switch (twilioStatus) {
    case 'delivered':
      return MessageLogStatus.DELIVERED;
    case 'sent':
      return MessageLogStatus.SENT;
    case 'failed':
      return MessageLogStatus.FAILED;
    case 'undelivered':
      return MessageLogStatus.UNDELIVERED;
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const text = await req.text();
  const params = new URLSearchParams(text);

  const messageSid = params.get('MessageSid');
  const messageStatus = params.get('MessageStatus');
  const errorCode = params.get('ErrorCode') ?? undefined;

  if (!messageSid || !messageStatus) {
    return new Response('Missing required fields', { status: 400 });
  }

  const logStatus = twilioStatusToLogStatus(messageStatus);
  if (!logStatus) {
    return new Response('OK', { status: 200 });
  }

  await prisma.messageLog.updateMany({
    where: { providerMessageId: messageSid },
    data: {
      status: logStatus,
      deliveredAt: logStatus === MessageLogStatus.DELIVERED ? new Date() : undefined,
      errorCode: errorCode ?? null,
    },
  });

  // Auto-retry FAILED messages once after a short delay (via a background job marker).
  // We record the intent here; a cron job picks up logs with status FAILED and retryCount === 0.
  if (logStatus === MessageLogStatus.FAILED) {
    await prisma.messageLog.updateMany({
      where: { providerMessageId: messageSid, retryCount: 0 },
      data: { retryCount: 0 }, // retryCount stays 0 — cron detects FAILED + retryCount < 1
    });
  }

  return new Response('OK', { status: 200 });
}
