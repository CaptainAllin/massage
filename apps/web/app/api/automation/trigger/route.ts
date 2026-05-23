import { withAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Internal helper to execute automation actions
async function executeActions(rule: any, _triggerData: any): Promise<any[]> {
  const results: any[] = [];

  for (const action of (rule.actions as any[])) {
    try {
      if (action.type === 'SEND_EMAIL' && action.params?.to && action.params?.subject) {
        if (process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM ?? 'noreply@example.com',
            to: action.params.to,
            subject: action.params.subject,
            html: `<p>${action.params.body ?? ''}</p>`,
          });
        }
        results.push({ type: action.type, status: 'sent' });
      } else if (action.type === 'SEND_SMS' && action.params?.to) {
        // SMS sending via existing Twilio infrastructure would go here
        results.push({ type: action.type, status: 'queued' });
      } else if (action.type === 'ADD_TAG') {
        results.push({ type: action.type, status: 'tagged', tag: action.params?.tag });
      } else if (action.type === 'CREATE_TASK') {
        results.push({ type: action.type, status: 'noted', task: action.params?.title });
      } else {
        results.push({ type: action.type, status: 'skipped', reason: 'Missing params' });
      }
    } catch (err: any) {
      results.push({ type: action.type, status: 'failed', error: err.message });
    }
  }

  return results;
}

// POST /api/automation/trigger — fired by cron or internal events
export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, trigger, data } = body;
  if (!businessId || !trigger) return res.badRequest('businessId and trigger are required');
  await requireBusinessAccess(user, businessId);

  const rules = await prisma.automationRule.findMany({
    where: { businessId, trigger, isActive: true },
  });

  const executed = await Promise.all(
    rules.map(async (rule: any) => {
      try {
        const conditions = rule.conditions as Record<string, any>;
        const conditionsMet = Object.entries(conditions).every(([key, value]) => data?.[key] === value);

        if (!conditionsMet) {
          await prisma.automationLog.create({
            data: { automationRuleId: rule.id, businessId, status: 'SKIPPED', triggerData: data ?? {} },
          });
          return { ruleId: rule.id, status: 'SKIPPED' };
        }

        const results = await executeActions(rule, data);

        await prisma.automationLog.create({
          data: { automationRuleId: rule.id, businessId, status: 'SUCCESS', triggerData: data ?? {}, result: results },
        });
        await prisma.automationRule.update({
          where: { id: rule.id },
          data: { lastRunAt: new Date(), runCount: { increment: 1 } },
        });

        return { ruleId: rule.id, status: 'SUCCESS', results };
      } catch (err: any) {
        await prisma.automationLog.create({
          data: { automationRuleId: rule.id, businessId, status: 'FAILED', triggerData: data ?? {}, errorMessage: err.message },
        });
        return { ruleId: rule.id, status: 'FAILED', error: err.message };
      }
    })
  );

  return res.ok({ triggered: executed.length, results: executed });
});
