import { prisma } from './prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Condition tree types ──────────────────────────────────────────────────

export type ComparatorType =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export interface ConditionRule {
  field: string;
  comparator: ComparatorType;
  value: string;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  rules: ConditionRule[];
}

function evaluateSingleRule(rule: ConditionRule, data: Record<string, any>): boolean {
  const actual = data?.[rule.field];
  const expected = rule.value;
  switch (rule.comparator) {
    case 'equals': return String(actual ?? '') === String(expected);
    case 'not_equals': return String(actual ?? '') !== String(expected);
    case 'contains': return String(actual ?? '').toLowerCase().includes(String(expected).toLowerCase());
    case 'greater_than': return parseFloat(String(actual ?? 0)) > parseFloat(String(expected));
    case 'less_than': return parseFloat(String(actual ?? 0)) < parseFloat(String(expected));
    case 'is_empty': return actual === null || actual === undefined || actual === '';
    case 'is_not_empty': return actual !== null && actual !== undefined && actual !== '';
    default: return true;
  }
}

export function evaluateConditionTree(conditions: any, data: Record<string, any>): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  // New tree format
  if ('operator' in conditions && 'rules' in conditions) {
    const group = conditions as ConditionGroup;
    if (!group.rules || group.rules.length === 0) return true;
    return group.operator === 'OR'
      ? group.rules.some((r) => evaluateSingleRule(r, data))
      : group.rules.every((r) => evaluateSingleRule(r, data));
  }
  // Legacy flat format
  return Object.entries(conditions).every(([key, value]) => data?.[key] === value);
}

// ─── Template resolver ────────────────────────────────────────────────────

export function resolveTemplate(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_match, namespace, field) => {
    const ns = context[namespace];
    if (ns && field in ns) return String(ns[field] ?? '');
    return '';
  });
}

export async function buildContext(businessId: string, data: Record<string, any>): Promise<Record<string, any>> {
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
      email: appointment.therapist?.user?.email ?? '',
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

  if (data.bookingCount !== undefined || data.revenue !== undefined) {
    context.summary = {
      bookingCount: String(data.bookingCount ?? 0),
      revenue: `$${Number(data.revenue ?? 0).toFixed(2)}`,
      date: data.date ?? new Date().toLocaleDateString(),
    };
  }

  return context;
}

// ─── Action executor ──────────────────────────────────────────────────────

export async function executeAction(
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

    case 'APPEND_SHEET': {
      const spreadsheetId = resolveTemplate(p.spreadsheetId ?? '', context);
      const sheetName = resolveTemplate(p.sheetName ?? 'Sheet1', context);
      if (!spreadsheetId) return { type: action.type, status: 'skipped', reason: 'Missing spreadsheetId' };

      const biz = await prisma.business.findUnique({
        where: { id: businessId },
        select: { googleAccessToken: true, googleRefreshToken: true } as any,
      }) as any;
      if (!biz?.googleAccessToken) return { type: action.type, status: 'skipped', reason: 'Google Sheets not connected' };

      let accessToken: string = biz.googleAccessToken;
      const refreshToken: string | null = biz.googleRefreshToken;
      if (refreshToken && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const testRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (testRes.status === 401) {
          const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            }),
          });
          const refreshData = await refreshRes.json() as { access_token?: string };
          if (refreshData.access_token) {
            accessToken = refreshData.access_token;
            await prisma.business.update({
              where: { id: businessId },
              data: { googleAccessToken: accessToken } as any,
            });
          }
        }
      }

      const columns: string[] = Array.isArray(p.columns) ? p.columns : (p.columns ? JSON.parse(p.columns) : []);
      const row = columns.map((col: string) => resolveTemplate(col, context));

      const range = sheetName ? `${sheetName}!A1` : 'A1';
      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ values: [row] }),
        },
      );

      if (!appendRes.ok) {
        const errText = await appendRes.text().catch(() => '');
        return { type: action.type, status: 'failed', error: `Sheets API ${appendRes.status}`, detail: errText.slice(0, 200) };
      }
      return { type: action.type, status: 'appended', spreadsheetId, row };
    }

    case 'ADD_TO_EMAIL_LIST': {
      const email = resolveTemplate(p.email ?? '{{client.email}}', context);
      const firstName = resolveTemplate(p.firstName ?? '{{client.firstName}}', context);
      const lastName = resolveTemplate(p.lastName ?? '{{client.lastName}}', context);
      if (!email) return { type: action.type, status: 'skipped', reason: 'Missing email' };

      const biz = await prisma.business.findUnique({
        where: { id: businessId },
        select: { mailchimpApiKey: true, mailchimpAudienceId: true } as any,
      }) as any;
      if (!biz?.mailchimpApiKey) return { type: action.type, status: 'skipped', reason: 'Mailchimp not connected' };

      const listId = resolveTemplate(p.listId ?? '', context) || biz.mailchimpAudienceId;
      if (!listId) return { type: action.type, status: 'skipped', reason: 'No Mailchimp audience ID configured' };

      const dcMatch = (biz.mailchimpApiKey as string).match(/-([a-z0-9]+)$/);
      if (!dcMatch) return { type: action.type, status: 'failed', error: 'Invalid Mailchimp API key format' };
      const dc = dcMatch[1];

      const tags: string[] = Array.isArray(p.tags) ? p.tags : (p.tags ? JSON.parse(p.tags) : []);

      const mcRes = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${biz.mailchimpApiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: { FNAME: firstName, LNAME: lastName },
          tags,
        }),
      });

      if (!mcRes.ok) {
        const errJson = await mcRes.json().catch(() => ({})) as { title?: string; detail?: string };
        if (mcRes.status === 400 && errJson.title === 'Member Exists') {
          return { type: action.type, status: 'skipped', reason: 'Already subscribed' };
        }
        return { type: action.type, status: 'failed', error: errJson.title ?? `Mailchimp ${mcRes.status}` };
      }
      return { type: action.type, status: 'added', email, listId };
    }

    case 'SYNC_TO_HUBSPOT': {
      const email = resolveTemplate(p.email ?? '{{client.email}}', context);
      const firstName = resolveTemplate(p.firstName ?? '{{client.firstName}}', context);
      const lastName = resolveTemplate(p.lastName ?? '{{client.lastName}}', context);
      if (!email) return { type: action.type, status: 'skipped', reason: 'Missing email' };

      const biz = await prisma.business.findUnique({
        where: { id: businessId },
        select: { hubspotAccessToken: true } as any,
      }) as any;
      if (!biz?.hubspotAccessToken) return { type: action.type, status: 'skipped', reason: 'HubSpot not connected' };

      const hsToken: string = biz.hubspotAccessToken;

      const upsertRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hsToken}` },
        body: JSON.stringify({
          inputs: [{
            idProperty: 'email',
            id: email,
            properties: { email, firstname: firstName, lastname: lastName },
          }],
        }),
      });

      if (!upsertRes.ok) {
        const errText = await upsertRes.text().catch(() => '');
        return { type: action.type, status: 'failed', error: `HubSpot API ${upsertRes.status}`, detail: errText.slice(0, 200) };
      }

      if (p.createDeal === 'true' && data.amount) {
        const amount = typeof data.amount === 'number' ? data.amount : parseFloat(String(data.amount));
        await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hsToken}` },
          body: JSON.stringify({
            properties: {
              dealname: resolveTemplate(p.dealName ?? 'Payment from {{client.firstName}} {{client.lastName}}', context),
              amount: isNaN(amount) ? undefined : amount,
              dealstage: 'closedwon',
              closedate: new Date().toISOString().split('T')[0],
            },
          }),
        }).catch(() => null);
      }

      return { type: action.type, status: 'synced', email };
    }

    case 'BRANCH': {
      const conditionMet = evaluateSingleRule(
        {
          field: String(p.conditionField ?? ''),
          comparator: (p.conditionComparator ?? 'equals') as ComparatorType,
          value: String(p.conditionValue ?? ''),
        },
        data,
      );
      const branchActions: any[] = conditionMet
        ? (Array.isArray(p.thenActions) ? p.thenActions : [])
        : (Array.isArray(p.elseActions) ? p.elseActions : []);

      const branchResults = [];
      for (const branchAction of branchActions) {
        try {
          const result = await executeAction(branchAction, context, businessId, data);
          branchResults.push(result);
        } catch (err: any) {
          branchResults.push({ type: branchAction.type, status: 'failed', error: err.message });
        }
      }
      return { type: 'BRANCH', status: 'executed', branch: conditionMet ? 'then' : 'else', results: branchResults };
    }

    default:
      return { type: action.type, status: 'skipped', reason: 'Unknown action type' };
  }
}

// ─── Core runner ──────────────────────────────────────────────────────────

async function runAutomation(trigger: string, businessId: string, data: Record<string, any>): Promise<void> {
  const rules = await prisma.automationRule.findMany({
    where: { businessId, trigger, isActive: true },
  });
  if (rules.length === 0) return;

  const context = await buildContext(businessId, data);
  const now = new Date();

  await Promise.all(
    rules.map(async (rule) => {
      try {
        const conditions = rule.conditions as Record<string, any>;
        const conditionsMet = evaluateConditionTree(conditions, data);

        if (!conditionsMet) {
          await prisma.automationLog.create({
            data: { automationRuleId: rule.id, businessId, status: 'SKIPPED', triggerData: data },
          });
          return;
        }

        const results: any[] = [];
        for (let idx = 0; idx < (rule.actions as any[]).length; idx++) {
          const action = (rule.actions as any[])[idx];
          const delayHours: number = typeof action.delayHours === 'number' ? action.delayHours : 0;

          if (delayHours > 0) {
            const executeAt = new Date(now.getTime() + delayHours * 60 * 60 * 1000);
            await (prisma as any).scheduledAction.create({
              data: {
                automationRuleId: rule.id,
                businessId,
                actionIndex: idx,
                executeAt,
                triggerData: data,
                status: 'PENDING',
                cancelIfEvent: action.cancelIfEvent ?? null,
              },
            });
            results.push({ type: action.type, status: 'scheduled', executeAt: executeAt.toISOString(), delayHours });
          } else {
            try {
              const result = await executeAction(action, context, businessId, data);
              results.push(result);
            } catch (err: any) {
              results.push({ type: action.type, status: 'failed', error: err.message });
            }
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

export async function triggerAutomation(trigger: string, businessId: string, data: Record<string, any>): Promise<void> {
  return runAutomation(trigger, businessId, data);
}

// ─── Default rules catalog ────────────────────────────────────────────────

const DEFAULT_RULES: Array<{
  name: string;
  description: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: Array<{ type: string; params: Record<string, any> }>;
}> = [
  {
    name: 'Booking Confirmation',
    description: 'Sends email and SMS to client when an appointment is booked.',
    trigger: 'APPOINTMENT_BOOKED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Your appointment is confirmed — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nYour appointment is confirmed for {{appointment.date}} at {{appointment.time}} with {{appointment.therapistName}}.\n\nIf you need to reschedule or cancel, please contact us at {{business.phone}}.\n\nWe look forward to seeing you!\n\n{{business.name}}',
        },
      },
      {
        type: 'SEND_SMS',
        params: {
          to: '{{client.phone}}',
          message: 'Hi {{client.firstName}}, your appointment at {{business.name}} is confirmed for {{appointment.date}} at {{appointment.time}}. Reply STOP to opt out.',
        },
      },
    ],
  },
  {
    name: '24-Hour Reminder',
    description: 'Sends SMS reminder to client 24 hours before their appointment.',
    trigger: 'APPOINTMENT_REMINDER_24H',
    conditions: {},
    actions: [
      {
        type: 'SEND_SMS',
        params: {
          to: '{{client.phone}}',
          message: 'Hi {{client.firstName}}, reminder: your appointment at {{business.name}} is tomorrow at {{appointment.time}}. See you soon! Reply STOP to opt out.',
        },
      },
    ],
  },
  {
    name: '2-Hour Reminder',
    description: 'Sends email reminder to client 2 hours before their appointment.',
    trigger: 'APPOINTMENT_REMINDER_2H',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Reminder: Your appointment is in 2 hours — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nJust a quick reminder that your appointment at {{business.name}} is coming up soon.\n\nDate: {{appointment.date}}\nTime: {{appointment.time}}\nTherapist: {{appointment.therapistName}}\n\nSee you soon!\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'Post-Visit Follow-Up',
    description: 'Sends follow-up email 24 hours after appointment with rebooking link.',
    trigger: 'APPOINTMENT_FOLLOWUP',
    conditions: { hoursAfterCompletion: 24 },
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'How was your visit? — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nThank you for visiting us! We hope your session with {{appointment.therapistName}} was wonderful.\n\nWe\'d love to see you again. Book your next appointment here:\n{{business.bookingUrl}}\n\nTake care,\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'Cancellation Confirmation',
    description: 'Sends cancellation confirmation email to client with rebooking link.',
    trigger: 'APPOINTMENT_CANCELLED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Appointment Cancelled — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nYour appointment on {{appointment.date}} at {{appointment.time}} has been cancelled.\n\nWe hope to see you again soon. Book a new appointment here:\n{{business.bookingUrl}}\n\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'No-Show Follow-Up',
    description: 'Sends email to client and creates a staff task when a client no-shows.',
    trigger: 'APPOINTMENT_NO_SHOW',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'We missed you — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nWe noticed you missed your appointment on {{appointment.date}}. We hope everything is okay!\n\nWe\'d love to reschedule. Book a new appointment here:\n{{business.bookingUrl}}\n\n{{business.name}}',
        },
      },
      {
        type: 'CREATE_TASK',
        params: {
          title: 'Follow up with {{client.firstName}} — no-show on {{appointment.date}}',
          description: 'Client missed their appointment. Consider calling or emailing to reschedule.',
        },
      },
    ],
  },
  {
    name: 'New Client Welcome',
    description: 'Sends a welcome email to new clients with booking link.',
    trigger: 'CLIENT_CREATED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Welcome to {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nWelcome to {{business.name}}! We\'re so glad to have you.\n\nYou can book your first appointment here:\n{{business.bookingUrl}}\n\nIf you have any questions, don\'t hesitate to reach out at {{business.phone}}.\n\nLooking forward to seeing you,\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'Re-engagement',
    description: 'Sends email and SMS to clients who haven\'t visited in 60 days.',
    trigger: 'CLIENT_RECALL_DUE',
    conditions: { daysSinceLastVisit: 60 },
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'We miss you — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nIt\'s been a while since we\'ve seen you! We\'d love to have you back.\n\nBook your next session here:\n{{business.bookingUrl}}\n\nHope to see you soon,\n{{business.name}}',
        },
      },
      {
        type: 'SEND_SMS',
        params: {
          to: '{{client.phone}}',
          message: 'Hi {{client.firstName}}, we miss you at {{business.name}}! Book your next session: {{business.bookingUrl}} Reply STOP to opt out.',
        },
      },
    ],
  },
  {
    name: 'Birthday Message',
    description: 'Sends birthday greetings via email and SMS on the client\'s birthday.',
    trigger: 'CLIENT_BIRTHDAY',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Happy Birthday from {{business.name}}!',
          body: 'Hi {{client.firstName}},\n\nHappy Birthday! Wishing you a wonderful day filled with joy.\n\nTreat yourself to a relaxing session:\n{{business.bookingUrl}}\n\nWith warm wishes,\n{{business.name}}',
        },
      },
      {
        type: 'SEND_SMS',
        params: {
          to: '{{client.phone}}',
          message: 'Happy Birthday {{client.firstName}}! Treat yourself to a session at {{business.name}}: {{business.bookingUrl}} Reply STOP to opt out.',
        },
      },
    ],
  },
  {
    name: 'Invoice Receipt',
    description: 'Sends payment receipt email to client after a payment is received.',
    trigger: 'PAYMENT_RECEIVED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Payment Receipt — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nThank you for your payment of {{invoice.amount}}.\n\nInvoice #{{invoice.number}} has been marked as paid.\n\nThank you for choosing {{business.name}}!\n\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'Overdue Invoice Reminder',
    description: 'Sends reminder email to client when an invoice becomes overdue.',
    trigger: 'INVOICE_OVERDUE',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Invoice Overdue — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nThis is a reminder that invoice #{{invoice.number}} for {{invoice.amount}} was due on {{invoice.dueDate}} and remains unpaid.\n\nPlease contact us at {{business.phone}} to arrange payment.\n\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'New Booking — Staff Alert',
    description: 'Sends push notification to assigned therapist when a new appointment is booked.',
    trigger: 'APPOINTMENT_BOOKED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{therapist.email}}',
          subject: 'New Booking — {{client.firstName}} {{client.lastName}}',
          body: 'Hi {{therapist.name}},\n\n{{client.firstName}} {{client.lastName}} has booked an appointment on {{appointment.date}} at {{appointment.time}}.\n\n{{business.name}}',
        },
      },
      {
        type: 'SEND_PUSH',
        params: {
          recipientUserId: 'ALL_STAFF',
          title: 'New Booking',
          body: '{{client.firstName}} {{client.lastName}} booked for {{appointment.date}} at {{appointment.time}}',
        },
      },
    ],
  },
  {
    name: 'Cancellation — Staff Alert',
    description: 'Sends email to assigned therapist when an appointment is cancelled.',
    trigger: 'APPOINTMENT_CANCELLED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{therapist.email}}',
          subject: 'Appointment Cancelled — {{client.firstName}} {{client.lastName}}',
          body: 'Hi {{therapist.name}},\n\n{{client.firstName}} {{client.lastName}} has cancelled their appointment on {{appointment.date}} at {{appointment.time}}.\n\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'Package Running Low',
    description: 'Notifies client by email when they have 2 or fewer sessions remaining on a package.',
    trigger: 'PACKAGE_LOW_CREDITS',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{client.email}}',
          subject: 'Your package is running low — {{business.name}}',
          body: 'Hi {{client.firstName}},\n\nYou have just 2 sessions remaining on your package. Don\'t let them go to waste!\n\nBook your next session:\n{{business.bookingUrl}}\n\nOr contact us to renew: {{business.phone}}\n\n{{business.name}}',
        },
      },
    ],
  },
  {
    name: 'Intake Form Submitted — Staff Alert',
    description: 'Sends email to assigned therapist when a client submits an intake form.',
    trigger: 'INTAKE_FORM_SUBMITTED',
    conditions: {},
    actions: [
      {
        type: 'SEND_EMAIL',
        params: {
          to: '{{therapist.email}}',
          subject: 'Intake Form Submitted — {{client.firstName}} {{client.lastName}}',
          body: 'Hi {{therapist.name}},\n\n{{client.firstName}} {{client.lastName}} has submitted their intake form. Please review it before their next appointment.\n\n{{business.name}}',
        },
      },
    ],
  },
];

export async function seedDefaultAutomationRules(businessId: string): Promise<void> {
  await prisma.automationRule.createMany({
    data: DEFAULT_RULES.map((rule) => ({
      businessId,
      name: rule.name,
      description: rule.description,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
      isActive: true,
    })),
  });
}
