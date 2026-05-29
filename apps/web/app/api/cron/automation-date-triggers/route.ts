import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerAutomation } from '@/lib/automation';
import { res } from '@/lib/api-auth';

// Runs daily at 9am. Fires date-based automation triggers:
// CLIENT_BIRTHDAY, MEMBERSHIP_EXPIRY_SOON, INVOICE_OVERDUE, CLIENT_RECALL_DUE
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return res.unauthorized('Invalid cron secret');

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  let triggered = 0;

  async function firedToday(ruleIds: string[], key: string, keyField: string): Promise<boolean> {
    if (ruleIds.length === 0) return true;
    const log = await prisma.automationLog.findFirst({
      where: {
        automationRuleId: { in: ruleIds },
        executedAt: { gte: todayStart },
        triggerData: { path: [keyField], equals: key },
      },
    });
    return !!log;
  }

  // --- CLIENT_BIRTHDAY ---
  const birthdayRules = await prisma.automationRule.findMany({
    where: { trigger: 'CLIENT_BIRTHDAY', isActive: true },
    select: { id: true, businessId: true },
  });

  if (birthdayRules.length > 0) {
    const bizIds = [...new Set(birthdayRules.map((r) => r.businessId))];
    const rulesByBiz: Record<string, string[]> = {};
    for (const r of birthdayRules) (rulesByBiz[r.businessId] ??= []).push(r.id);

    const clients = await prisma.client.findMany({
      where: { businessId: { in: bizIds }, dateOfBirth: { not: null }, isActive: true },
      select: { id: true, businessId: true, dateOfBirth: true },
    });

    for (const client of clients) {
      const dob = client.dateOfBirth!;
      if (dob.getMonth() !== now.getMonth() || dob.getDate() !== now.getDate()) continue;
      const ruleIds = rulesByBiz[client.businessId] ?? [];
      if (await firedToday(ruleIds, client.id, 'clientId')) continue;
      await triggerAutomation('CLIENT_BIRTHDAY', client.businessId, {
        clientId: client.id, businessId: client.businessId,
      });
      triggered++;
    }
  }

  // --- MEMBERSHIP_EXPIRY_SOON: 7 days before endDate ---
  const expiryRules = await prisma.automationRule.findMany({
    where: { trigger: 'MEMBERSHIP_EXPIRY_SOON', isActive: true },
    select: { id: true, businessId: true },
  });

  if (expiryRules.length > 0) {
    const bizIds = [...new Set(expiryRules.map((r) => r.businessId))];
    const rulesByBiz: Record<string, string[]> = {};
    for (const r of expiryRules) (rulesByBiz[r.businessId] ??= []).push(r.id);

    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 3600000);
    const eightDaysFromNow = new Date(now.getTime() + 8 * 24 * 3600000);

    const memberships = await prisma.membership.findMany({
      where: {
        businessId: { in: bizIds },
        status: 'ACTIVE',
        endDate: { gte: sevenDaysFromNow, lte: eightDaysFromNow },
      },
      select: { id: true, clientId: true, businessId: true, endDate: true, name: true },
    });

    for (const m of memberships) {
      const ruleIds = rulesByBiz[m.businessId] ?? [];
      if (await firedToday(ruleIds, m.id, 'membershipId')) continue;
      await triggerAutomation('MEMBERSHIP_EXPIRY_SOON', m.businessId, {
        membershipId: m.id, clientId: m.clientId, businessId: m.businessId,
        membershipName: m.name, endDate: m.endDate?.toISOString(),
      });
      triggered++;
    }
  }

  // --- INVOICE_OVERDUE: past dueDate, still unpaid ---
  const overdueRules = await prisma.automationRule.findMany({
    where: { trigger: 'INVOICE_OVERDUE', isActive: true },
    select: { id: true, businessId: true },
  });

  if (overdueRules.length > 0) {
    const bizIds = [...new Set(overdueRules.map((r) => r.businessId))];
    const rulesByBiz: Record<string, string[]> = {};
    for (const r of overdueRules) (rulesByBiz[r.businessId] ??= []).push(r.id);

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        businessId: { in: bizIds },
        dueDate: { lt: now },
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      select: { id: true, clientId: true, businessId: true, dueDate: true, amountDue: true, invoiceNumber: true },
    });

    for (const inv of overdueInvoices) {
      const ruleIds = rulesByBiz[inv.businessId] ?? [];
      if (await firedToday(ruleIds, inv.id, 'invoiceId')) continue;
      await triggerAutomation('INVOICE_OVERDUE', inv.businessId, {
        invoiceId: inv.id, clientId: inv.clientId, businessId: inv.businessId,
        invoiceNumber: inv.invoiceNumber, amountDue: inv.amountDue,
        dueDate: inv.dueDate?.toISOString(),
      });
      triggered++;
    }
  }

  // --- CLIENT_RECALL_DUE: client hasn't booked in X days (default 60) ---
  const recallRules = await prisma.automationRule.findMany({
    where: { trigger: 'CLIENT_RECALL_DUE', isActive: true },
    select: { id: true, businessId: true, conditions: true },
  });

  for (const rule of recallRules) {
    const days = Number((rule.conditions as any)?.daysSinceLastVisit ?? 60);
    // Window: clients whose lastVisitDate crossed the threshold today (X days ± 12h)
    const windowStart = new Date(now.getTime() - (days + 0.5) * 24 * 3600000);
    const windowEnd = new Date(now.getTime() - (days - 0.5) * 24 * 3600000);

    const clients = await prisma.client.findMany({
      where: {
        businessId: rule.businessId,
        isActive: true,
        OR: [
          { lastVisitDate: { gte: windowStart, lte: windowEnd } },
          { lastVisitDate: null, createdAt: { gte: windowStart, lte: windowEnd } },
        ],
      },
      select: { id: true, businessId: true },
    });

    for (const client of clients) {
      if (await firedToday([rule.id], client.id, 'clientId')) continue;
      await triggerAutomation('CLIENT_RECALL_DUE', client.businessId, {
        clientId: client.id, businessId: client.businessId, daysSinceLastVisit: days,
      });
      triggered++;
    }
  }

  // --- INTAKE_FORM_NOT_COMPLETED: forms sent X+ days ago but not submitted ---
  const intakeNotCompletedRules = await prisma.automationRule.findMany({
    where: { trigger: 'INTAKE_FORM_NOT_COMPLETED', isActive: true },
    select: { id: true, businessId: true, conditions: true },
  });

  for (const rule of intakeNotCompletedRules) {
    const daysSinceSent = Number((rule.conditions as any)?.daysSinceSent ?? 3);
    const cutoff = new Date(now.getTime() - daysSinceSent * 24 * 3600000);

    const forms = await prisma.intakeForm.findMany({
      where: {
        businessId: rule.businessId,
        isSubmitted: false,
        createdAt: { lte: cutoff },
      },
      select: { id: true, clientId: true, businessId: true, createdAt: true },
    });

    for (const form of forms) {
      if (await firedToday([rule.id], form.id, 'intakeFormId')) continue;
      await triggerAutomation('INTAKE_FORM_NOT_COMPLETED', form.businessId, {
        intakeFormId: form.id,
        clientId: form.clientId,
        businessId: form.businessId,
        daysSinceSent: Math.floor((now.getTime() - form.createdAt.getTime()) / (24 * 3600000)),
      });
      triggered++;
    }
  }

  return res.ok({ triggered });
}
