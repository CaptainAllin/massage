'use client';

import { useDashboard, type DashboardAppointment } from './use-dashboard';
import { usePaymentStats } from './use-payments';
import { useAppointments } from './use-appointments';

// ─── Colour palette ───────────────────────────────────────────────────────────

const THERAPIST_COLORS = ['#5D4AA8', '#3E9E7A', '#3A87D4', '#DE9277', '#7665C2'];
const SERVICE_COLORS   = ['#5D4AA8', '#7665C2', '#3E9E7A', '#3A87D4', '#DE9277'];
const DAY_LABELS       = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function hashColor(id: string, palette: string[]): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h || 12;
  return `${h12}:${m} ${ampm}`;
}

function therapistShortName(appt: DashboardAppointment): string {
  if (!appt.therapist?.user) return 'Staff';
  const fn = appt.therapist.user.firstName ?? '';
  const ln = appt.therapist.user.lastName ?? '';
  return ln ? `${fn} ${ln.charAt(0)}.` : fn || 'Staff';
}

// ─── Exported types ───────────────────────────────────────────────────────────

export interface MobileSession {
  id: string;
  client: string;
  service: string;
  therapist: string;
  therapistColor: string;
  time: string;
  status: string;
}

export interface MobileServiceSlice {
  label: string;
  value: number;
  pct: number;
  color: string;
}

export interface WeekBar {
  label: string;
  value: number;
  today: boolean;
}

export interface MobileDashboardData {
  isLoading: boolean;
  error: unknown;
  sessions: MobileSession[];
  clientCount: number;
  revenueThisMonth: number;
  revenueGrowth: number;
  serviceMix: MobileServiceSlice[];
  serviceMixTotal: number;
  smsUsed: number;
  smsTotal: number;
  todayCollected: number;
  weekPending: number;
  weekRefunded: number;
  weekBars: WeekBar[];
  weekTotal: number;
  weekTherapistCount: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMobileDashboard(businessId: string | undefined): MobileDashboardData {
  const dashboard = useDashboard(businessId);

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const { data: payStats } = usePaymentStats(
    businessId,
    monthStart.toISOString().split('T')[0],
    today.toISOString().split('T')[0],
  );

  // Current week: Monday 00:00 through Sunday 23:59
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const { data: weekData } = useAppointments(businessId, {
    startDate: weekStart.toISOString().split('T')[0],
    endDate: weekEnd.toISOString().split('T')[0],
    limit: 200,
  });

  // Build week bars (Mon=0 .. Sun=6)
  const todayDow = (today.getDay() + 6) % 7;
  const weekBars: WeekBar[] = DAY_LABELS.map((label, i) => ({
    label,
    value: 0,
    today: i === todayDow,
  }));

  const weekApptList = weekData?.data ?? [];
  const weekTherapistIds = new Set<string>();
  for (const appt of weekApptList) {
    if (appt.status === 'CANCELLED' as string) continue;
    const dow = (new Date(String(appt.startTime)).getDay() + 6) % 7;
    if (dow >= 0 && dow < 7) weekBars[dow].value++;
    if (appt.therapistId) weekTherapistIds.add(appt.therapistId);
  }
  const weekTotal = weekBars.reduce((s, b) => s + b.value, 0);
  const weekTherapistCount = weekTherapistIds.size;

  // Map appointments → MobileSession
  const rawSessions: DashboardAppointment[] = dashboard.data?.todayAppointments ?? [];
  const sessions: MobileSession[] = rawSessions.map((a) => {
    const clientName = a.client
      ? `${a.client.firstName} ${a.client.lastName}`
      : 'Unknown';
    const therapistId = a.therapist?.id ?? a.id;
    return {
      id: a.id,
      client: clientName,
      service: a.serviceType || 'Session',
      therapist: therapistShortName(a),
      therapistColor: hashColor(therapistId, THERAPIST_COLORS),
      time: fmtTime(a.startTime),
      status: a.status.toLowerCase(),
    };
  });

  // Map service mix → slices with percentages + colours
  const rawMix = dashboard.data?.serviceMix ?? [];
  const mixTotal = rawMix.reduce((s, m) => s + m.count, 0) || 1;
  const serviceMix: MobileServiceSlice[] = rawMix.slice(0, 5).map((m, i) => ({
    label: m.serviceType || 'Other',
    value: m.count,
    pct: Math.round((m.count / mixTotal) * 100),
    color: SERVICE_COLORS[i % SERVICE_COLORS.length],
  }));

  // SMS credits
  const sms = dashboard.data?.smsCredits;

  // Payment stats for today / week / pending / refunded
  const byStatus = (payStats as any)?.byStatus ?? {};
  const todayCollected = (byStatus['COMPLETED']?.total ?? 0);
  const weekPending    = (byStatus['PENDING']?.total ?? 0);
  const weekRefunded   = (byStatus['REFUNDED']?.total ?? 0) + (byStatus['PARTIALLY_REFUNDED']?.total ?? 0);

  return {
    isLoading: dashboard.isLoading,
    error: dashboard.error,
    sessions,
    clientCount: dashboard.data?.clientCount ?? 0,
    revenueThisMonth: dashboard.data?.revenue?.totalRevenue ?? 0,
    revenueGrowth: Math.round((dashboard.data?.revenue?.revenueGrowth ?? 0) * 10) / 10,
    serviceMix,
    serviceMixTotal: rawMix.reduce((s, m) => s + m.count, 0),
    smsUsed: sms?.creditsUsed ?? 0,
    smsTotal: sms?.creditsIncluded ?? 200,
    todayCollected,
    weekPending,
    weekRefunded,
    weekBars,
    weekTotal,
    weekTherapistCount,
  };
}
