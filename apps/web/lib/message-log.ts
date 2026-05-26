import { prisma } from './prisma';
import { MessageChannel, MessageLogStatus } from '@prisma/client';

export { MessageChannel, MessageLogStatus };

export interface CreateMessageLogParams {
  businessId: string;
  clientId?: string | null;
  appointmentId?: string | null;
  channel: MessageChannel;
  messageType: string;
  recipient: string;
  subject?: string | null;
  metadata?: Record<string, any> | null;
}

export async function createMessageLog(params: CreateMessageLogParams) {
  return prisma.messageLog.create({
    data: {
      businessId: params.businessId,
      clientId: params.clientId ?? null,
      appointmentId: params.appointmentId ?? null,
      channel: params.channel,
      messageType: params.messageType,
      recipient: params.recipient,
      subject: params.subject ?? null,
      status: MessageLogStatus.QUEUED,
      metadata: params.metadata ?? undefined,
    },
  });
}

export async function markMessageLogSent(id: string, providerMessageId: string) {
  return prisma.messageLog.update({
    where: { id },
    data: { status: MessageLogStatus.SENT, providerMessageId, sentAt: new Date() },
  });
}

export async function markMessageLogFailed(id: string, errorCode?: string) {
  return prisma.messageLog.update({
    where: { id },
    data: { status: MessageLogStatus.FAILED, errorCode: errorCode ?? null },
  });
}

export async function updateMessageLogStatus(
  providerMessageId: string,
  status: MessageLogStatus,
  deliveredAt?: Date,
) {
  return prisma.messageLog.updateMany({
    where: { providerMessageId },
    data: {
      status,
      deliveredAt: deliveredAt ?? undefined,
    },
  });
}
