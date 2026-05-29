import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerAutomation } from '@/lib/automation';
import { res } from '@/lib/api-auth';

// Runs every hour. Fires time-based appointment automation triggers:
// APPOINTMENT_REMINDER_24H, APPOINTMENT_REMINDER_2H, APPOINTMENT_REMINDER_CUSTOM, APPOINTMENT_FOLLOWUP
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return res.unauthorized('Invalid cron secret');

  const now = new Date();
  const dedup = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  let triggered = 0;

  // Check if automation was already fired for a specific appointment in the last 48h
  async function hasBeenFired(ruleIds: string[], appointmentId: string): Promise<boolean> {
    if (ruleIds.length === 0) return true;
    const log = await prisma.automationLog.findFirst({
      where: {
        automationRuleId: { in: ruleIds },
        executedAt: { gte: dedup },
        triggerData: { path: ['appointmentId'], equals: appointmentId },
      },
    });
    return !!log;
  }

  // --- APPOINTMENT_REMINDER_24H: 23–25h before start ---
  const rules24h = await prisma.automationRule.findMany({
    where: { trigger: 'APPOINTMENT_REMINDER_24H', isActive: true },
    select: { id: true, businessId: true },
  });

  if (rules24h.length > 0) {
    const businessIds = [...new Set(rules24h.map((r) => r.businessId))];
    const rulesByBiz: Record<string, string[]> = {};
    for (const r of rules24h) {
      (rulesByBiz[r.businessId] ??= []).push(r.id);
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: { in: businessIds },
        startTime: { gte: new Date(now.getTime() + 23 * 3600000), lte: new Date(now.getTime() + 25 * 3600000) },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      select: { id: true, clientId: true, therapistId: true, startTime: true, businessId: true, serviceType: true },
    });

    for (const apt of appointments) {
      const ruleIds = rulesByBiz[apt.businessId] ?? [];
      if (await hasBeenFired(ruleIds, apt.id)) continue;
      await triggerAutomation('APPOINTMENT_REMINDER_24H', apt.businessId, {
        appointmentId: apt.id, clientId: apt.clientId, therapistId: apt.therapistId,
        serviceType: apt.serviceType, startTime: apt.startTime.toISOString(), businessId: apt.businessId,
      });
      triggered++;
    }
  }

  // --- APPOINTMENT_REMINDER_2H: 1.5–2.5h before start ---
  const rules2h = await prisma.automationRule.findMany({
    where: { trigger: 'APPOINTMENT_REMINDER_2H', isActive: true },
    select: { id: true, businessId: true },
  });

  if (rules2h.length > 0) {
    const businessIds = [...new Set(rules2h.map((r) => r.businessId))];
    const rulesByBiz: Record<string, string[]> = {};
    for (const r of rules2h) {
      (rulesByBiz[r.businessId] ??= []).push(r.id);
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: { in: businessIds },
        startTime: { gte: new Date(now.getTime() + 90 * 60000), lte: new Date(now.getTime() + 150 * 60000) },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      select: { id: true, clientId: true, therapistId: true, startTime: true, businessId: true, serviceType: true },
    });

    for (const apt of appointments) {
      const ruleIds = rulesByBiz[apt.businessId] ?? [];
      if (await hasBeenFired(ruleIds, apt.id)) continue;
      await triggerAutomation('APPOINTMENT_REMINDER_2H', apt.businessId, {
        appointmentId: apt.id, clientId: apt.clientId, therapistId: apt.therapistId,
        serviceType: apt.serviceType, startTime: apt.startTime.toISOString(), businessId: apt.businessId,
      });
      triggered++;
    }
  }

  // --- APPOINTMENT_REMINDER_CUSTOM: configurable offset from conditions.hoursBeforeAppointment ---
  const customRules = await prisma.automationRule.findMany({
    where: { trigger: 'APPOINTMENT_REMINDER_CUSTOM', isActive: true },
    select: { id: true, businessId: true, conditions: true },
  });

  for (const rule of customRules) {
    const hours = Number((rule.conditions as any)?.hoursBeforeAppointment ?? 48);
    const windowStart = new Date(now.getTime() + (hours - 0.5) * 3600000);
    const windowEnd = new Date(now.getTime() + (hours + 0.5) * 3600000);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: rule.businessId,
        startTime: { gte: windowStart, lte: windowEnd },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      select: { id: true, clientId: true, therapistId: true, startTime: true, businessId: true, serviceType: true },
    });

    for (const apt of appointments) {
      if (await hasBeenFired([rule.id], apt.id)) continue;
      await triggerAutomation('APPOINTMENT_REMINDER_CUSTOM', apt.businessId, {
        appointmentId: apt.id, clientId: apt.clientId, therapistId: apt.therapistId,
        serviceType: apt.serviceType, startTime: apt.startTime.toISOString(), businessId: apt.businessId,
        hoursBeforeAppointment: hours,
      });
      triggered++;
    }
  }

  // --- APPOINTMENT_FOLLOWUP: X hours after appointment start (default 24h) ---
  const followupRules = await prisma.automationRule.findMany({
    where: { trigger: 'APPOINTMENT_FOLLOWUP', isActive: true },
    select: { id: true, businessId: true, conditions: true },
  });

  for (const rule of followupRules) {
    const hours = Number((rule.conditions as any)?.hoursAfterCompletion ?? 24);
    const windowStart = new Date(now.getTime() - (hours + 0.5) * 3600000);
    const windowEnd = new Date(now.getTime() - (hours - 0.5) * 3600000);

    const completed = await prisma.appointment.findMany({
      where: {
        businessId: rule.businessId,
        status: 'COMPLETED',
        startTime: { gte: windowStart, lte: windowEnd },
      },
      select: { id: true, clientId: true, therapistId: true, startTime: true, businessId: true, serviceType: true },
    });

    for (const apt of completed) {
      if (await hasBeenFired([rule.id], apt.id)) continue;
      await triggerAutomation('APPOINTMENT_FOLLOWUP', apt.businessId, {
        appointmentId: apt.id, clientId: apt.clientId, therapistId: apt.therapistId,
        serviceType: apt.serviceType, startTime: apt.startTime.toISOString(), businessId: apt.businessId,
      });
      triggered++;
    }
  }

  return res.ok({ triggered });
}
