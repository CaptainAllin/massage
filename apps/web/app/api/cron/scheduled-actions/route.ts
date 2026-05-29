import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeAction, buildContext } from '@/lib/automation';
import { res } from '@/lib/api-auth';

// Runs every 5 minutes. Processes PENDING ScheduledAction records that are due.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return res.unauthorized('Invalid cron secret');

  const now = new Date();

  const due = await (prisma as any).scheduledAction.findMany({
    where: { status: 'PENDING', executeAt: { lte: now } },
    include: { rule: { select: { actions: true, businessId: true } } },
    take: 100,
  });

  let processed = 0;
  let cancelled = 0;

  for (const scheduled of due) {
    const { id, automationRuleId, businessId, actionIndex, triggerData, cancelIfEvent } = scheduled;
    const data = triggerData as Record<string, any>;

    try {
      // Check cancelIfEvent: if the trigger event fired for same client since this was scheduled
      if (cancelIfEvent && data.clientId) {
        const cancelLog = await prisma.automationLog.findFirst({
          where: {
            businessId,
            executedAt: { gte: scheduled.createdAt },
            rule: { trigger: cancelIfEvent },
            triggerData: { path: ['clientId'], equals: data.clientId },
          },
        });
        if (cancelLog) {
          await (prisma as any).scheduledAction.update({
            where: { id },
            data: { status: 'CANCELLED' },
          });
          cancelled++;
          continue;
        }
      }

      const rule = scheduled.rule;
      const actions = rule?.actions as any[];
      const action = actions?.[actionIndex];

      if (!action) {
        await (prisma as any).scheduledAction.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });
        cancelled++;
        continue;
      }

      const context = await buildContext(businessId, data);
      const result = await executeAction(action, context, businessId, data);

      await (prisma as any).scheduledAction.update({
        where: { id },
        data: { status: 'DONE' },
      });

      await prisma.automationLog.create({
        data: {
          automationRuleId,
          businessId,
          status: result.status === 'failed' ? 'FAILED' : 'SUCCESS',
          triggerData: data,
          result: [result],
        },
      });

      processed++;
    } catch (err: any) {
      await (prisma as any).scheduledAction.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      await prisma.automationLog.create({
        data: {
          automationRuleId,
          businessId,
          status: 'FAILED',
          triggerData: data,
          errorMessage: err.message,
        },
      });
    }
  }

  return res.ok({ processed, cancelled, total: due.length });
}
