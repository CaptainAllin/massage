'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@massage/auth';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness } from '@/lib/hooks/use-business';
import { useDashboard, type DashboardData } from '@/lib/hooks/use-dashboard';
import { formatCurrency } from '@/lib/format';
import { apiClient } from '@/lib/api-client';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { CHECKLIST_ITEMS, ChecklistItemId } from '@/lib/hooks/use-onboarding';
import { TeamAdoptionCards } from '@/components/onboarding/TeamAdoptionCards';

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

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

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, icon, trend, delta, sparkId,
}: {
  label: string; value: string | number; sub?: string; accent?: string;
  icon: React.ReactNode; trend?: number[]; delta?: string; sparkId?: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(93,74,168,0.08), transparent 70%)' }} />
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
        <div className="rounded-xl flex items-center justify-center w-10 h-10 flex-shrink-0"
          style={{ background: accent ?? '#EDE5F4' }}>
          {icon}
        </div>
      </div>
      {trend && sparkId && (
        <div className="mt-3 flex items-end justify-between">
          <Sparkline data={trend} id={sparkId} />
          {delta && <span className="text-xs font-semibold" style={{ color: '#5D4AA8' }}>{delta}</span>}
        </div>
      )}
    </div>
  );
}

// ── Setup card slim (replaces the big GettingStartedCard) ─────────────────────

function SetupCardSlim({
  checkedItems,
  onToggle,
  onDismiss,
}: {
  checkedItems: Set<ChecklistItemId>;
  onToggle: (id: ChecklistItemId) => void;
  onDismiss: () => void;
}) {
  const done = checkedItems.size;
  const total = CHECKLIST_ITEMS.length;
  const nextItem = CHECKLIST_ITEMS.find((item) => !checkedItems.has(item.id));

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)', position: 'relative', overflow: 'hidden' }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(93,74,168,0.06), transparent 70%)' }} />
      <div className="relative flex items-start justify-between mb-3">
        <div>
          <p className="uppercase mb-1" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', color: '#5D4AA8' }}>
            Finish setup · {done}/{total}
          </p>
          <h3 className="font-semibold" style={{ fontSize: '15px', color: '#1E1830', letterSpacing: '-0.2px', margin: 0 }}>
            {done === 0 ? "Let's get your practice ready" : done < total ? "You're almost ready to go live" : 'All set!'}
          </h3>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
          style={{ color: '#7A7090', background: '#F3F4F7' }}
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar dots */}
      <div className="flex gap-1.5 mb-4">
        {CHECKLIST_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex-1 rounded-full transition-all duration-300"
            style={{ height: 4, background: checkedItems.has(item.id) ? '#5D4AA8' : '#EDE5F4' }}
          />
        ))}
      </div>

      {/* Step chips */}
      <div className="flex flex-wrap gap-2">
        {CHECKLIST_ITEMS.map((item) => {
          const isDone = checkedItems.has(item.id);
          const isNext = item.id === nextItem?.id;
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                padding: '5px 11px',
                background: isDone ? 'transparent' : isNext ? '#EDE5F4' : '#F8F5FC',
                border: `1px solid ${isDone ? '#E5DEEC' : isNext ? 'rgba(93,74,168,0.3)' : '#EFE9F2'}`,
                color: isDone ? '#B0A8C0' : isNext ? '#3D3450' : '#5D3C95',
                textDecoration: isDone ? 'line-through' : 'none',
                cursor: 'pointer',
              }}
            >
              <span
                className="flex-shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: 14, height: 14,
                  background: isDone ? '#5D4AA8' : 'transparent',
                  border: isDone ? 'none' : `1.5px solid ${isNext ? '#5D4AA8' : '#C4B8D8'}`,
                  color: '#fff',
                }}
              >
                {isDone && (
                  <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 12 12">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
              </span>
              <Link href={item.href} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'inherit' }}>
                {item.label}
              </Link>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Appointment row ───────────────────────────────────────────────────────────

function ApptRow({
  clientName, service, time, status, isNow, isCompleted,
}: {
  clientName: string; service: string; time: string;
  status: string; isNow?: boolean; isCompleted?: boolean;
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
          <span className="text-xs font-semibold rounded-full px-2.5 py-0.5 inline-block"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff', fontSize: '10px' }}>
            NOW
          </span>
        ) : (
          <p className="text-xs font-medium" style={{ color: '#3D3450' }}>{time}</p>
        )}
        <span className="text-xs font-medium rounded-full px-2 py-0.5 inline-block"
          style={{ background: s.bg, color: s.text, fontSize: '10px' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Revenue chart ─────────────────────────────────────────────────────────────

function RevenueChart({ businessId, currency = 'AUD', initialRevenue }: { businessId: string; currency?: string; initialRevenue?: DashboardData['revenue'] }) {
  const [period, setPeriod] = useState<'30d' | '90d' | '1y'>('30d');
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-revenue', businessId, period],
    queryFn: async () => {
      const r = await apiClient.get('/analytics/revenue', { params: { businessId, startDate, endDate } });
      return r.data.data as { totalRevenue: number; revenueGrowth: number };
    },
    enabled: !!businessId,
    initialData: period === '30d' ? initialRevenue : undefined,
  });

  const total = data?.totalRevenue ?? 0;
  const growth = data?.revenueGrowth ?? 0;

  const sparkData30 = [180,210,165,240,260,190,150,180,220,265,290,240,180,220,260,310,280,240,260,310,290,330,300,280,320,360,340,310,360,420];
  const sparkData90 = [600,750,900,850,1100,1050,1300,1200,1450,1400,1600,1550,1800,1750,1950,1900,2100,2200];
  const sparkData1y = [500,600,750,900,850,1100,1300,1450,1700,1900,2100,2300,2450,2600,2800,3000];
  const sparkData = period === '30d' ? sparkData30 : period === '90d' ? sparkData90 : sparkData1y;

  const W = 320, H = 80;
  const smax = Math.max(...sparkData), smin = Math.min(...sparkData);
  const srange = smax - smin || 1;
  const pts = sparkData.map((v, i) => {
    const x = (i / (sparkData.length - 1)) * W;
    const y = H - ((v - smin) / srange) * (H - 10) - 5;
    return [x, y] as [number, number];
  });
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  const fmtRevenue = (n: number) => n >= 1000
    ? formatCurrency(n / 1000, currency, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k'
    : formatCurrency(n, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const xLabels: Record<string, [string, string, string]> = {
    '30d': ['Apr 26', 'May 10', 'Today'],
    '90d': ['Feb 24', 'Apr 10', 'Today'],
    '1y':  ['May 25', 'Nov 10', 'Today'],
  };
  const [lbl1, lbl2, lbl3] = xLabels[period];

  return (
    <div className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}>
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
        <div className="flex gap-1 p-1 rounded-full" style={{ background: '#F3F4F7' }}>
          {(['30d', '90d', '1y'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={period === p
                ? { background: '#fff', color: '#3D3450', boxShadow: '0 1px 3px rgba(93,74,168,0.12)' }
                : { background: 'transparent', color: '#7A7090' }}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg" style={{ height: 80 }}>
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

// ── Service mix — donut chart ─────────────────────────────────────────────────

const SERVICE_PALETTE = ['#5D4AA8', '#7A92D2', '#C97E68', '#8A6FBE', '#A87A7A'];

const DEFAULT_SERVICES = [
  { serviceType: 'Deep Tissue', count: 46 },
  { serviceType: 'Swedish',     count: 34 },
  { serviceType: 'Hot Stone',   count: 26 },
  { serviceType: 'Sports',      count: 20 },
  { serviceType: 'Prenatal',    count: 16 },
];

function ServiceMixDonut({ initialMix }: { initialMix?: DashboardData['serviceMix'] }) {
  const services: Array<{ label: string; count: number; color: string }> =
    initialMix && initialMix.length > 0
      ? initialMix.map((d, i) => ({ label: d.serviceType, count: d.count, color: SERVICE_PALETTE[i] }))
      : DEFAULT_SERVICES.map((s, i) => ({ label: s.serviceType, count: s.count, color: SERVICE_PALETTE[i] }));

  const isLoading = false;

  const total = services.reduce((a, s) => a + s.count, 0) || 1;
  const size = 112, thick = 16;
  const r = (size - thick) / 2;
  const C = 2 * Math.PI * r;

  // Pre-compute dash offsets
  const offsets: number[] = [];
  let acc = 0;
  services.forEach((s) => {
    offsets.push(acc);
    acc += (s.count / total) * C;
  });

  return (
    <div className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}>
      <p className="uppercase mb-4" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', color: '#5D4AA8' }}>
        Service Mix · 30d
      </p>
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-4 rounded-full animate-pulse" style={{ background: '#EDE5F4' }} />)}
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Donut SVG */}
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
              style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="#F1EEF6" strokeWidth={thick} />
              {services.map((s, i) => {
                const len = (s.count / total) * C;
                return (
                  <circle key={i}
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={s.color} strokeWidth={thick}
                    strokeDasharray={`${Math.max(0, len - 2)} ${C - Math.max(0, len - 2)}`}
                    strokeDashoffset={-offsets[i]}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '20px', fontWeight: 600, color: '#1E1830', lineHeight: 1 }}>
                {total}
              </span>
              <span style={{ fontSize: '9.5px', color: '#7A7090', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>
                sessions
              </span>
            </div>
          </div>
          {/* Legend */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {services.map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '11.5px', color: '#3D3450', lineHeight: 1 }}>{s.label}</span>
                <span style={{ fontSize: '11px', color: '#7A7090', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.round((s.count / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SMS Credits Widget ────────────────────────────────────────────────────────

function SmsCreditWidget({ smsCredits }: { smsCredits: DashboardData['smsCredits'] | undefined }) {
  const data = smsCredits;

  if (!data || data.isUnlimited) return null;

  const barColor = data.isExhausted ? '#C94040' : data.isNearLimit ? '#C97E68' : '#5D4AA8';
  const pct = Math.min(100, Math.round(data.percentUsed));

  return (
    <div className="rounded-2xl px-5 py-4 flex items-center gap-5"
      style={{ background: '#fff', border: `1px solid ${data.isExhausted ? '#F5D5D5' : data.isNearLimit ? '#F7E5DD' : '#EFE9F2'}`, boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}>
      <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: data.isExhausted ? '#FEE9E9' : data.isNearLimit ? '#F7E5DD' : '#EDE5F4' }}>
        <svg width="16" height="16" fill="none" stroke={barColor} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold uppercase" style={{ letterSpacing: '1.2px', color: barColor }}>
            SMS Credits · This Period
          </p>
          <p className="text-xs font-semibold tabular-nums" style={{ color: '#3D3450' }}>
            {data.creditsUsed} / {data.creditsIncluded}
          </p>
        </div>
        <div className="w-full overflow-hidden" style={{ height: '5px', background: '#EDE5F4', borderRadius: '3px' }}>
          <div style={{ width: `${pct}%`, height: '5px', background: barColor, borderRadius: '3px', transition: 'width 0.4s ease' }} />
        </div>
        {(data.isNearLimit || data.isExhausted) && (
          <p className="mt-1.5 text-xs" style={{ color: barColor }}>
            {data.isExhausted
              ? 'Credits exhausted — SMS paused until next billing cycle.'
              : `${data.creditsRemaining} credits remaining — approaching your plan limit.`}
          </p>
        )}
      </div>
      {data.isNearLimit && (
        <a href="/settings"
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }}>
          Upgrade
        </a>
      )}
    </div>
  );
}

// ── This week sessions bar chart ──────────────────────────────────────────────

const DEMO_WEEK_DATA = [
  { day: 'M', sessions: 18 },
  { day: 'T', sessions: 22 },
  { day: 'W', sessions: 19 },
  { day: 'T', sessions: 24 },
  { day: 'F', sessions: 21 },
  { day: 'S', sessions: 14 },
  { day: 'S', sessions: 8 },
];

function WeeklySessionsBar() {
  const todayIdx = new Date().getDay(); // 0=Sun … 6=Sat; remap to Mon-first
  const monFirstIdx = todayIdx === 0 ? 6 : todayIdx - 1;
  const total = DEMO_WEEK_DATA.reduce((a, d) => a + d.sessions, 0);
  const maxV = Math.max(...DEMO_WEEK_DATA.map((d) => d.sessions));

  return (
    <div className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="uppercase" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', color: '#5D4AA8' }}>
            This week
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>{total} sessions · 3 therapists</p>
        </div>
      </div>
      <div className="flex items-end gap-2" style={{ height: 80 }}>
        {DEMO_WEEK_DATA.map((d, i) => {
          const isToday = i === monFirstIdx;
          const barH = Math.round((d.sessions / maxV) * 54);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 justify-end" style={{ height: '100%' }}>
              <span style={{ fontSize: '10px', color: isToday ? '#5D4AA8' : '#B0A8C0', fontVariantNumeric: 'tabular-nums', fontWeight: isToday ? 600 : 400 }}>
                {d.sessions}
              </span>
              <div
                className="w-full rounded-lg transition-all"
                style={{
                  height: barH,
                  maxWidth: 28,
                  background: isToday ? 'linear-gradient(180deg, #7665C2, #5D4AA8)' : '#EDE5F4',
                  border: isToday ? 'none' : '1px solid #E5DEEC',
                  boxShadow: isToday ? '0 1px 4px rgba(28,20,54,0.14)' : 'none',
                }}
              />
              <span style={{ fontSize: '9.5px', color: isToday ? '#5D4AA8' : '#B0A8C0', fontWeight: isToday ? 600 : 400, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const businessId = useBusinessId();
  const { data: business } = useBusiness(businessId);
  const currency = (business as any)?.currency || 'AUD';
  const firstName = user?.user_metadata?.first_name || '';
  const {
    loaded,
    checkedItems,
    toggleItem,
    checklistDismissed,
    dismissChecklist,
    allDone,
    congratsShown,
    dismissedAdoptionCards,
    dismissAdoptionCard,
  } = useOnboardingContext();

  const { data: dashboardData, isLoading } = useDashboard(businessId);
  const todayAppts = dashboardData?.todayAppointments ?? [];
  const totalClients = dashboardData?.clientCount ?? 0;

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const sessionTrend = [2, 3, 1, 4, 2, 5, isLoading ? 3 : (todayAppts.length || 3)];
  const clientTrend  = [85, 88, 90, 92, 94, 96, isLoading ? 98 : (totalClients || 98)];
  const revTrend     = [800, 1100, 950, 1400, 1200, 1550, 1400];
  const formTrend    = [3, 2, 4, 1, 2, 1, 0];

  return (
    <div className="space-y-5">

      {/* ── Greeting ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="uppercase mb-1.5" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.6px', color: '#5D4AA8' }}>
            Practice overview
          </p>
          <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 500, color: '#1E1830', letterSpacing: '-0.8px', lineHeight: 1.1 }}>
            Good {getGreeting()},{' '}
            <span style={{ background: 'linear-gradient(120deg, #5D4AA8, #E8A893)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {firstName || 'there'}
            </span>.
          </h1>
          <p className="mt-1.5" style={{ fontSize: '13.5px', color: '#7A7090' }}>
            {isLoading
              ? 'Loading your day…'
              : todayAppts.length === 0
                ? 'No sessions scheduled today.'
                : `${todayAppts.length} session${todayAppts.length !== 1 ? 's' : ''} today · ${dayName}, ${dateStr}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0"
          style={{ padding: '6px 6px 6px 14px', background: '#FFFFFF', borderRadius: 999, border: '1px solid #E5DEEC' }}>
          <span style={{ fontSize: '12px', color: '#7A7090' }}>Studio</span>
          <span className="flex items-center gap-1.5 font-semibold"
            style={{ padding: '4px 12px', borderRadius: 999, background: '#EDE5F4', color: '#5D4AA8', fontSize: '11.5px' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#5D4AA8' }} />
            Open · 8a — 7p
          </span>
        </div>
      </div>

      {/* ── Setup card slim (dashboard-only, self-retires at 100%) ── */}
      {loaded && !checklistDismissed && !allDone && (
        <SetupCardSlim
          checkedItems={checkedItems}
          onToggle={toggleItem}
          onDismiss={dismissChecklist}
        />
      )}

      {/* ── Team adoption cards (shown after onboarding complete) ── */}
      {loaded && congratsShown && (
        <TeamAdoptionCards
          dismissedCards={dismissedAdoptionCards}
          onDismiss={dismissAdoptionCard}
        />
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sessions"
          value={isLoading ? '—' : todayAppts.length}
          sub={isLoading ? undefined : todayAppts.length === 0 ? 'None scheduled' : 'Scheduled today'}
          trend={sessionTrend} delta="↑ 12%" sparkId="sessions"
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
          trend={clientTrend} delta="↑ 8%" sparkId="clients"
          icon={
            <svg width="18" height="18" fill="none" stroke="#5D4AA8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard
          label="This Month"
          value="$0" sub="Revenue — see chart" accent="#F7E5DD"
          trend={revTrend} delta="↑ 18%" sparkId="revenue"
          icon={
            <svg width="18" height="18" fill="none" stroke="#C97E68" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Pending Forms"
          value="0" sub="Intake forms"
          trend={formTrend} delta="↓ 2" sparkId="forms"
          icon={
            <svg width="18" height="18" fill="none" stroke="#5D4AA8" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
      </div>

      {/* ── SMS Credits widget ── */}
      {businessId && <SmsCreditWidget smsCredits={dashboardData?.smsCredits} />}

      {/* ── Charts row: Revenue (1.7fr) | Service mix donut (1fr) ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)' }}>
        {businessId ? (
          <>
            <RevenueChart businessId={businessId} currency={currency} initialRevenue={dashboardData?.revenue} />
            <ServiceMixDonut initialMix={dashboardData?.serviceMix} />
          </>
        ) : (
          <>
            <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EFE9F2' }} />
            <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EFE9F2' }} />
          </>
        )}
      </div>

      {/* ── Lower two-column grid: Sessions (1.55fr) | Weekly bars + nudge (1fr) ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)' }}>

        {/* Today's sessions panel */}
        <div className="rounded-2xl p-5"
          style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ fontSize: '15px', color: '#1E1830' }}>Today&apos;s Sessions</h2>
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
              <Link href="/appointments"
                className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}>
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
              {todayAppts.length < 6 && (
                <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: '#F7E5DD', border: '1px solid rgba(201,126,104,0.2)' }}>
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(201,126,104,0.15)' }}>
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
                  <button className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'linear-gradient(135deg, #C97E68, #A86450)', color: '#fff' }}>
                    Send
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right side panel: This week chart + AI nudge */}
        <div className="flex flex-col gap-3.5">
          <WeeklySessionsBar />
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}>
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: '#F7E5DD' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" fill="#C97E68" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: '#C97E68' }}>5 open slots today</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Send a fill-in offer to your waitlist?</p>
            </div>
            <button className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #C97E68, #A86450)', color: '#fff' }}>
              Send
            </button>
          </div>
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
