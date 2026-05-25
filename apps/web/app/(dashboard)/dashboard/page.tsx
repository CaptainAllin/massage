'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@massage/auth';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useClients } from '@/lib/hooks/use-clients';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { apiClient } from '@/lib/api-client';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { GettingStartedCard } from '@/components/onboarding/GettingStartedCard';

// ── Sparkline SVG ──────────────────────────────────────────────────────────────

function Sparkline({ data, id }: { data: number[]; id: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as [number, number];
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const fill = `${line} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id={`sk-s-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7665C2" />
          <stop offset="100%" stopColor="#5D4AA8" />
        </linearGradient>
        <linearGradient id={`sk-f-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5D4AA8" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#5D4AA8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sk-f-${id})`} />
      <path d={line} stroke={`url(#sk-s-${id})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
  trend,
  delta,
  sparkId,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon: React.ReactNode;
  trend?: number[];
  delta?: string;
  sparkId?: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(93,74,168,0.08), transparent 70%)' }}
      />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-2 uppercase" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', color: '#5D4AA8' }}>
            {label}
          </p>
          <p className="tabular-nums font-semibold" style={{ fontSize: '30px', color: '#1E1830', letterSpacing: '-0.8px', lineHeight: 1 }}>
            {value}
          </p>
          {sub && <p className="mt-1.5 text-xs" style={{ color: '#7A7090' }}>{sub}</p>}
        </div>
        <div
          className="rounded-xl flex items-center justify-center w-10 h-10 flex-shrink-0"
          style={{ background: accent ?? '#EDE5F4' }}
        >
          {icon}
        </div>
      </div>
      {trend && sparkId && (
        <div className="mt-3 flex items-end justify-between">
          <Sparkline data={trend} id={sparkId} />
          {delta && (
            <span className="text-xs font-semibold" style={{ color: '#5D4AA8' }}>{delta}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Appointment row ────────────────────────────────────────────────────────────

function ApptRow({
  clientName,
  service,
  time,
  status,
  isNow,
  isCompleted,
}: {
  clientName: string;
  service: string;
  time: string;
  status: string;
  isNow?: boolean;
  isCompleted?: boolean;
}) {
  const statusColor: Record<string, { bg: string; text: string }> = {
    SCHEDULED: { bg: '#EDE5F4', text: '#5D4AA8' },
    CONFIRMED: { bg: '#EDE5F4', text: '#5D4AA8' },
    PENDING:   { bg: '#F7E5DD', text: '#C97E68' },
    COMPLETED: { bg: '#E5F5F0', text: '#2D8A67' },
    CANCELLED: { bg: '#F5E5E5', text: '#C94040' },
  };
  const s = statusColor[status] ?? { bg: '#EDE5F4', text: '#5D4AA8' };
  const label = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-2.5 rounded-xl mb-0.5 last:mb-0"
      style={{
        background: isNow ? '#EDE5F4' : 'transparent',
        border: isNow ? '1px solid rgba(93,74,168,0.2)' : '1px solid transparent',
        borderBottom: !isNow ? '1px solid #EFE9F2' : undefined,
        opacity: isCompleted ? 0.5 : 1,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold"
        style={{ background: '#EDE5F4', color: '#5D4AA8' }}
      >
        {clientName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#1E1830' }}>{clientName}</p>
        <p className="text-xs truncate" style={{ color: '#7A7090' }}>{service}</p>
      </div>
      <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
        {isNow ? (
          <span
            className="text-xs font-semibold rounded-full px-2.5 py-0.5 inline-block"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff', fontSize: '10px' }}
          >
            NOW
          </span>
        ) : (
          <p className="text-xs font-medium" style={{ color: '#3D3450' }}>{time}</p>
        )}
        <span
          className="text-xs font-medium rounded-full px-2 py-0.5 inline-block"
          style={{ background: s.bg, color: s.text, fontSize: '10px' }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Revenue Chart ──────────────────────────────────────────────────────────────

function RevenueChart({ businessId }: { businessId: string }) {
  const [period, setPeriod] = useState<'30d' | '90d' | '1y'>('30d');

  const days = period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-revenue', businessId, period],
    queryFn: async () => {
      const r = await apiClient.get('/analytics/revenue', {
        params: { businessId, startDate, endDate },
      });
      return r.data.data as { totalRevenue: number; revenueGrowth: number };
    },
    enabled: !!businessId,
  });

  const total = data?.totalRevenue ?? 0;
  const growth = data?.revenueGrowth ?? 0;

  // Placeholder sparkline data — shape reflects realistic growth curve
  const sparkData30 = [820, 1050, 900, 1380, 1100, 1250, 1420, 980, 1600, 1350, 1800, 1400, 1750, 1600, 1900, 1450, 2100, 1800, 1950, 2200, 1750, 2050, 1900, 2300, 2150, 2400, 2200, 2500, 2350, total > 0 ? total / 10 + 2400 : 2600];
  const sparkData90 = [600, 750, 900, 850, 1100, 1050, 1300, 1200, 1450, 1400, 1600, 1550, 1800, 1750, 1950, 1900, 2100, total > 0 ? total / 10 + 2000 : 2200];
  const sparkData1y = [500, 600, 750, 900, 850, 1100, 1300, 1450, 1700, 1900, 2100, 2300, 2450, 2600, 2800, total > 0 ? total / 10 + 2700 : 3000];
  const sparkData = period === '30d' ? sparkData30 : period === '90d' ? sparkData90 : sparkData1y;

  const W = 280;
  const H = 80;
  const smax = Math.max(...sparkData);
  const smin = Math.min(...sparkData);
  const srange = smax - smin || 1;
  const pts = sparkData.map((v, i) => {
    const x = (i / (sparkData.length - 1)) * W;
    const y = H - ((v - smin) / srange) * (H - 10) - 5;
    return [x, y] as [number, number];
  });
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  const fmtRevenue = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  const xLabels: Record<string, [string, string, string]> = {
    '30d': ['Apr 26', 'May 10', 'Today'],
    '90d': ['Feb 24', 'Apr 10', 'Today'],
    '1y':  ['May 25', 'Nov 10', 'Today'],
  };
  const [lbl1, lbl2, lbl3] = xLabels[period];

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="uppercase mb-1" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', color: '#5D4AA8' }}>
            Revenue
          </p>
          <div className="flex items-baseline gap-2">
            <span className="tabular-nums font-semibold" style={{ fontSize: '24px', color: '#1E1830', letterSpacing: '-0.6px' }}>
              {isLoading ? '—' : fmtRevenue(total)}
            </span>
            {!isLoading && (
              <span className="text-xs font-semibold" style={{ color: growth >= 0 ? '#5D4AA8' : '#C94040' }}>
                {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {(['30d', '90d', '1y'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={
                period === p
                  ? { background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }
                  : { background: '#EDE5F4', color: '#7A7090' }
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg" style={{ height: '80px' }}>
        <svg width="100%" height="80" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="rev-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5D4AA8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#5D4AA8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rev-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7665C2" />
              <stop offset="100%" stopColor="#5D4AA8" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill="url(#rev-fill)" />
          <path d={linePath} stroke="url(#rev-stroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex justify-between mt-1.5">
        {[lbl1, lbl2, lbl3].map(l => (
          <span key={l} style={{ fontSize: '10px', color: '#7A7090' }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ── Service Mix ────────────────────────────────────────────────────────────────

const SERVICE_PALETTE = ['#5D4AA8', '#7A92D2', '#C97E68', '#8A6FBE', '#A87A7A'];

const DEFAULT_SERVICES = [
  { serviceType: 'Deep Tissue', pct: 32 },
  { serviceType: 'Swedish',     pct: 24 },
  { serviceType: 'Hot Stone',   pct: 18 },
  { serviceType: 'Sports',      pct: 14 },
  { serviceType: 'Prenatal',    pct: 12 },
];

function ServiceMix({ businessId }: { businessId: string }) {
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-service-mix', businessId],
    queryFn: async () => {
      const r = await apiClient.get('/reports/revenue', {
        params: { businessId, startDate, endDate },
      });
      return r.data.data?.byServiceType as Array<{ serviceType: string; revenue: number; count: number }> | undefined;
    },
    enabled: !!businessId,
  });

  const services =
    data && data.length > 0
      ? (() => {
          const total = data.reduce((s, d) => s + d.count, 0) || 1;
          return data
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((d, i) => ({ serviceType: d.serviceType, pct: Math.round((d.count / total) * 100), color: SERVICE_PALETTE[i] }));
        })()
      : DEFAULT_SERVICES.map((s, i) => ({ ...s, color: SERVICE_PALETTE[i] }));

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <p className="uppercase mb-4" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', color: '#5D4AA8' }}>
        Service Mix · 30d
      </p>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 rounded-full animate-pulse" style={{ background: '#EDE5F4' }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.serviceType}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: '#3D3450' }}>{s.serviceType}</span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: '#7A7090' }}>{s.pct}%</span>
              </div>
              <div className="w-full overflow-hidden" style={{ height: '5px', background: '#EDE5F4', borderRadius: '3px' }}>
                <div style={{ width: `${s.pct}%`, height: '5px', background: s.color, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const businessId = useBusinessId();
  const firstName = user?.user_metadata?.first_name || '';
  const { loaded, checkedItems, toggleItem, checklistDismissed, dismissChecklist, allDone } = useOnboardingContext();
  const [mounted, setMounted] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: appointmentsData, isLoading: apptLoading } = useAppointments(
    businessId || '',
    { startDate: today, endDate: tomorrow }
  );
  const { data: clientsData, isLoading: clientsLoading } = useClients(
    businessId || '',
    { isActive: true }
  );

  useEffect(() => setMounted(true), []);

  const todayAppts = appointmentsData?.data ?? [];
  const totalClients = clientsData?.length ?? 0;
  const isLoading = !mounted || apptLoading || clientsLoading;

  const now = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Sparkline trend data (realistic demo shape — real daily data would require a separate endpoint)
  const sessionTrend = [2, 3, 1, 4, 2, 5, isLoading ? 3 : (todayAppts.length || 3)];
  const clientTrend  = [85, 88, 90, 92, 94, 96, isLoading ? 98 : (totalClients || 98)];
  const revTrend     = [800, 1100, 950, 1400, 1200, 1550, 1400];
  const formTrend    = [3, 2, 4, 1, 2, 1, 0];

  return (
    <div className="space-y-5">

      {/* ── Greeting banner ── */}
      <div
        className="relative rounded-2xl px-6 py-5 overflow-hidden flex items-start justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', boxShadow: '0 8px 32px rgba(93,74,168,0.28)' }}
      >
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)' }}
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '1.4px' }}>
            {dayName}, {dateStr}
          </p>
          <h1 className="font-semibold" style={{ fontSize: '22px', color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
            Good {getGreeting()}, {firstName || 'there'} 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {isLoading
              ? 'Loading your day…'
              : todayAppts.length === 0
                ? 'No appointments scheduled for today.'
                : `You have ${todayAppts.length} appointment${todayAppts.length !== 1 ? 's' : ''} today.`}
          </p>
        </div>

        {/* Studio status pill */}
        <div
          className="relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full self-start mt-0.5"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#4ADE80' }} />
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#fff' }}>Open · 8a — 7p</span>
        </div>
      </div>

      {/* ── Onboarding checklist ── */}
      {loaded && !checklistDismissed && !allDone && (
        <GettingStartedCard
          checkedItems={checkedItems}
          onToggle={toggleItem}
          onDismiss={dismissChecklist}
        />
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sessions"
          value={isLoading ? '—' : todayAppts.length}
          sub={isLoading ? undefined : todayAppts.length === 0 ? 'None scheduled' : 'Scheduled today'}
          trend={sessionTrend}
          delta="↑ 12%"
          sparkId="sessions"
          icon={
            <svg width="18" height="18" fill="none" stroke="#5D4AA8" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Active Clients"
          value={isLoading ? '—' : totalClients}
          sub={isLoading ? undefined : totalClients === 0 ? 'Add your first client' : 'In your practice'}
          trend={clientTrend}
          delta="↑ 8%"
          sparkId="clients"
          icon={
            <svg width="18" height="18" fill="none" stroke="#5D4AA8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="This Month"
          value="$0"
          sub="Revenue — see chart"
          accent="#F7E5DD"
          trend={revTrend}
          delta="↑ 18%"
          sparkId="revenue"
          icon={
            <svg width="18" height="18" fill="none" stroke="#C97E68" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Pending Forms"
          value="0"
          sub="Intake forms"
          trend={formTrend}
          delta="↓ 2"
          sparkId="forms"
          icon={
            <svg width="18" height="18" fill="none" stroke="#5D4AA8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
      </div>

      {/* ── Lower two-column grid: Sessions (1.55fr) | Charts (1fr) ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)' }}>

        {/* Today's sessions panel */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ fontSize: '15px', color: '#1E1830' }}>Today's Sessions</h2>
            <Link href="/appointments" className="text-xs font-semibold" style={{ color: '#5D4AA8' }}>
              View all →
            </Link>
          </div>

          {isLoading ? (
            <p className="text-sm py-6 text-center" style={{ color: '#7A7090' }}>Loading…</p>
          ) : todayAppts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#EDE5F4' }}>
                <svg width="22" height="22" fill="none" stroke="#5D4AA8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: '#3D3450' }}>No sessions today</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Schedule an appointment to get started</p>
              <Link
                href="/appointments"
                className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
              >
                + New Appointment
              </Link>
            </div>
          ) : (
            <>
              <div>
                {todayAppts.slice(0, 6).map((appt: any) => {
                  const clientName = appt.client
                    ? `${appt.client.firstName} ${appt.client.lastName}`
                    : 'Unknown Client';
                  const startDt = new Date(appt.startTime);
                  const endDt = new Date(appt.endTime);
                  const isNow = now >= startDt && now <= endDt;
                  const isCompleted = appt.status === 'COMPLETED';
                  const time = startDt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  return (
                    <ApptRow
                      key={appt.id}
                      clientName={clientName}
                      service={appt.serviceType ?? 'Session'}
                      time={time}
                      status={appt.status ?? 'CONFIRMED'}
                      isNow={isNow}
                      isCompleted={isCompleted}
                    />
                  );
                })}
              </div>

              {/* Open slots AI suggestion card */}
              {todayAppts.length < 6 && (
                <div
                  className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: '#F7E5DD', border: '1px solid rgba(201,126,104,0.2)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(201,126,104,0.15)' }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" fill="#C97E68" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: '#C97E68' }}>Open slots available</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#7A7090' }}>
                      {6 - todayAppts.length} slot{6 - todayAppts.length !== 1 ? 's' : ''} free today — send a fill-in offer?
                    </p>
                  </div>
                  <button
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'linear-gradient(135deg, #C97E68, #A86450)', color: '#fff' }}
                  >
                    Send
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Charts column: Revenue + Service Mix stacked */}
        <div className="flex flex-col gap-3.5">
          {businessId ? (
            <>
              <RevenueChart businessId={businessId} />
              <ServiceMix businessId={businessId} />
            </>
          ) : (
            <div
              className="rounded-2xl p-5 flex-1"
              style={{ background: '#fff', border: '1px solid #EFE9F2' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
