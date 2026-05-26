import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MessageLogStatus } from '@prisma/client';

// Resend sends a JSON array of events.
// https://resend.com/docs/dashboard/webhooks/event-types

function resendEventToLogStatus(eventType: string): MessageLogStatus | null {
  switch (eventType) {
    case 'email.delivered':
      return MessageLogStatus.DELIVERED;
    case 'email.bounced':
      return MessageLogStatus.FAILED;
    case 'email.delivery_delayed':
      return MessageLogStatus.SENT;
    case 'email.complained':
      return MessageLogStatus.UNDELIVERED;
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response('Invalid JSON', { status: 400 });

  // Resend sends individual events (not arrays)
  const events = Array.isArray(body) ? body : [body];

  for (const event of events) {
    const emailId: string | undefined = event?.data?.email_id;
    const eventType: string | undefined = event?.type;

    if (!emailId || !eventType) continue;

    const logStatus = resendEventToLogStatus(eventType);
    if (!logStatus) continue;

    await prisma.messageLog.updateMany({
      where: { providerMessageId: emailId },
      data: {
        status: logStatus,
        deliveredAt: logStatus === MessageLogStatus.DELIVERED ? new Date() : undefined,
      },
    });
  }

  return new Response('OK', { status: 200 });
}
