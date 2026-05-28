import { prisma } from './prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resolve {{namespace.field}} template variables
export function resolveTemplate(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_match, namespace, field) => {
    const ns = context[namespace];
    if (ns && field in ns) return String(ns[field] ?? '');
    return '';
  });
}

async function buildContext(businessId: string, data: Record<string, any>): Promise<Record<string, any>> {
  const context: Record<string, any> = {};
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const [business, client, appointment, invoice] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    data.clientId ? prisma.client.findUnique({ where: { id: data.clientId } }) : Promise.resolve(null),
    data.appointmentId
      ? prisma.appointment.findUnique({
          where: { id: data.appointmentId },
          include: { therapist: { include: { user: true } } },
        })
      : Promise.resolve(null),
    data.invoiceId ? prisma.invoice.findUnique({ where: { id: data.invoiceId } }) : Promise.resolve(null),
  ]);

  if (business) {
    context.business = {
      name: business.name,
      phone: business.phoneNumber ?? '',
      email: business.email ?? '',
      address: [business.address, business.city, business.state].filter(Boolean).join(', '),
      bookingUrl: `${appUrl}/book/${businessId}`,
    };
  }

  if (client) {
    context.client = {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email ?? '',
      phone: client.phoneNumber ?? '',
    };
  }

  if (appointment) {
    const therapistName = appointment.therapist?.user
      ? `${appointment.therapist.user.firstName} ${appointment.therapist.user.lastName}`
      : '';
    context.appointment = {
      id: appointment.id,
      date: appointment.startTime.toLocaleDateString(),
      time: appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      service: (appointment as any).serviceType ?? '',
      therapistName,
    };
    context.therapist = {
      id: appointment.therapistId,
      name: therapistName,
    };
  }

  if (invoice) {
    context.invoice = {
      id: invoice.id,
      number: invoice.invoiceNumber,
      amount: `$${invoice.total.toFixed(2)}`,
      dueDate: invoice.dueDate?.toLocaleDateString() ?? '',
    };
  }

  return context;
}

async function executeAction(
  action: { type: string; params: Record<string, any> },
  context: Record<string, any>,
  businessId: string,
  data: Record<string, any>,
): Promise<{ type: string; status: string; [key: string]: any }> {
  const p = action.params ?? {};

  switch (action.type) {
    case 'SEND_EMAIL': {
      const to = resolveTemplate(p.to ?? '', context);
      const subject = resolveTemplate(p.subject ?? '', context);
      const body = resolveTemplate(p.body ?? '', context);
      if (!to || !subject) return { type: action.type, status: 'skipped', reason: 'Missing to/subject' };
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'noreply@example.com',
          to,
          subject,
          html: `<p style="font-family:sans-serif;line-height:1.6">${body.replace(/\n/g, '<br>')}</p>`,
        });
      }
      return { type: action.type, status: 'sent', to };
    }

    case 'SEND_SMS': {
      const to = resolveTemplate(p.to ?? '', context);
      const message = resolveTemplate(p.message ?? '', context);
      if (!to || !message) return { type: action.type, status: 'skipped', reason: 'Missing to/message' };
      const { sendAutomationSms } = await import('./sms');
      await sendAutomationSms({ to, message, businessId, clientId: data.clientId ?? null });
      return { type: action.type, status: 'sent', to };
    }

    case 'ADD_TAG': {
      const tag = resolveTemplate(p.tag ?? '', context);
      const clientId = data.clientId ?? context.client?.id;
      if (!tag || !clientId) return { type: action.type, status: 'skipped', reason: 'Missing tag or clientId' };
      await prisma.client.update({
        where: { id: clientId },
        data: { tags: { push: tag } },
      });
      return { type: action.type, status: 'tagged', tag };
    }

    case 'CREATE_TASK': {
      const title = resolveTemplate(p.title ?? '', context);
      if (!title) return { type: action.type, status: 'skipped', reason: 'Missing title' };
      const biz = await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true } });
      if (!biz) return { type: action.type, status: 'skipped', reason: 'Business not found' };
      const task = await prisma.task.create({
        data: {
          businessId,
          title,
          description: p.description ? resolveTemplate(p.description, context) : undefined,
          createdById: biz.ownerId,
          assignedToId: p.assignedToId ?? undefined,
          relatedClientId: data.clientId ?? undefined,
          relatedAppointmentId: data.appointmentId ?? undefined,
        },
      });
      return { type: action.type, status: 'created', taskId: task.id };
    }

    case 'HTTP_REQUEST': {
      const url = resolveTemplate(p.url ?? '', context);
      if (!url) return { type: action.type, status: 'skipped', reason: 'Missing url' };

      const method = ((p.method as string) ?? 'POST').toUpperCase();
      const body = p.body ? resolveTemplate(p.body, context) : undefined;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (p.headers) {
        try {
          const raw = JSON.parse(p.headers);
          for (const [k, v] of Object.entries(raw)) {
            headers[resolveTemplate(k, context)] = resolveTemplate(String(v), context);
          }
        } catch { /* ignore invalid JSON */ }
      }

      const fetchRes = await fetch(url, {
        method,
        headers,
        ...(method !== 'GET' && body ? { body } : {}),
      });
      const responseText = await fetchRes.text().catch(() => '');
      const ok = fetchRes.status >= 200 && fetchRes.status < 300;
      return {
        type: action.type,
        status: ok ? 'sent' : 'failed',
        statusCode: fetchRes.status,
        response: responseText.slice(0, 500),
        ...(ok ? {} : { error: `HTTP ${fetchRes.status}` }),
      };
    }

    case 'SEND_SLACK': {
      const message = resolveTemplate(p.message ?? '', context);
      if (!message) return { type: action.type, status: 'skipped', reason: 'Missing message' };

      const biz = await prisma.business.findUnique({
        where: { id: businessId },
        select: { slackAccessToken: true, slackDefaultChannel: true },
      });
      if (!biz?.slackAccessToken) return { type: action.type, status: 'skipped', reason: 'Slack not connected' };

      const channel = resolveTemplate(p.channel ?? '', context) || biz.slackDefaultChannel;
      if (!channel) return { type: action.type, status: 'skipped', reason: 'No Slack channel configured' };

      const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${biz.slackAccessToken}` },
        body: JSON.stringify({ channel, text: message }),
      });
      const slackJson = await slackRes.json() as { ok: boolean; error?: string };
      if (!slackJson.ok) return { type: action.type, status: 'failed', error: slackJson.error };
      return { type: action.type, status: 'sent', channel };
    }

    case 'SEND_PUSH': {
      const title = resolveTemplate(p.title ?? '', context);
      const body = resolveTemplate(p.body ?? '', context);
      if (!title) return { type: action.type, status: 'skipped', reason: 'Missing title' };

      const { broadcastToSubscriptions } = await import('./push-notifications');
      const { getSubscriptionsForUser } = await import('./push-subscriptions');

      const recipientParam = resolveTemplate(p.recipientUserId ?? 'ALL_STAFF', context);
      let userIds: string[] = [];

      if (recipientParam === 'ALL_STAFF') {
        const pushBiz = await prisma.business.findUnique({
          where: { id: businessId },
          select: { ownerId: true, therapists: { select: { userId: true } } },
        });
        if (pushBiz) userIds = [pushBiz.ownerId, ...pushBiz.therapists.map((t) => t.userId)];
      } else {
        userIds = [recipientParam];
      }

      let sent = 0;
      for (const uid of userIds) {
        const subs = getSubscriptionsForUser(uid);
        if (subs.length > 0) {
          await broadcastToSubscriptions(subs, { title, body });
          sent++;
        }
      }
      return { type: action.type, status: 'sent', sent };
    }

    case 'UPDATE_CLIENT': {
      const clientId = data.clientId ?? context.client?.id;
      const field = p.field;
      const value = resolveTemplate(p.value ?? '', context);
      if (!clientId || !field) return { type: action.type, status: 'skipped', reason: 'Missing clientId or field' };

      const allowed = ['goals', 'occupation', 'primaryPhysician', 'insuranceProvider', 'insurancePolicyNumber'];
      if (!allowed.includes(field)) {
        return { type: action.type, status: 'skipped', reason: `Field '${field}' is not updatable` };
      }

      await prisma.client.update({ where: { id: clientId }, data: { [field]: value } });
      return { type: action.type, status: 'updated', field, value };
    }

    default:
      return { type: action.type, status: 'skipped', reason: 'Unknown action type' };
  }
}

async function runAutomation(trigger: string, businessId: string, data: Record<string, any>): Promise<void> {
  const rules = await prisma.automationRule.findMany({
    where: { businessId, trigger, isActive: true },
  });
  if (rules.length === 0) return;

  const context = await buildContext(businessId, data);

  await Promise.all(
    rules.map(async (rule) => {
      try {
        const conditions = rule.conditions as Record<string, any>;
        const conditionsMet = Object.keys(conditions).length === 0 ||
          Object.entries(conditions).every(([key, value]) => data?.[key] === value);

        if (!conditionsMet) {
          await prisma.automationLog.create({
            data: { automationRuleId: rule.id, businessId, status: 'SKIPPED', triggerData: data },
          });
          return;
        }

        const results: any[] = [];
        for (const action of rule.actions as any[]) {
          try {
            const result = await executeAction(action, context, businessId, data);
            results.push(result);
          } catch (err: any) {
            results.push({ type: action.type, status: 'failed', error: err.message });
          }
        }

        const hasFailed = results.some((r) => r.status === 'failed');
        await prisma.automationLog.create({
          data: {
            automationRuleId: rule.id,
            businessId,
            status: hasFailed ? 'FAILED' : 'SUCCESS',
            triggerData: data,
            result: results,
          },
        });
        await prisma.automationRule.update({
          where: { id: rule.id },
          data: { lastRunAt: new Date(), runCount: { increment: 1 } },
        });
      } catch (err: any) {
        await prisma.automationLog.create({
          data: {
            automationRuleId: rule.id,
            businessId,
            status: 'FAILED',
            triggerData: data,
            errorMessage: err.message,
          },
        });
      }
    }),
  );
}

export function emitAutomation(trigger: string, businessId: string, data: Record<string, any>): void {
  runAutomation(trigger, businessId, data).catch((err) =>
    console.error('[automation] emitAutomation error:', err),
  );
}
