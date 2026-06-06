'use client';

import React, { useState, useEffect } from 'react';
import { Card, Avatar, StatusChip, SectionHead } from '../primitives';
import { AreaChart, Donut, Bars } from '../charts';
import { useAuth } from '@massage/auth';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useMobileDashboard, type MobileSession, type MobileServiceSlice, type WeekBar } from '@/lib/hooks/use-mobile-dashboard';
import { useBusinessHours } from '@/lib/hooks/use-business-hours';
import { useOnboarding, CHECKLIST_ITEMS } from '@/lib/hooks/use-onboarding';
import type { MobileRouter } from '../MobileShell';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Static chart data (no time-series API yet) ───────────────────────────────

const MOCK_REVENUE_30D = [4200, 3800, 5100, 4700, 6200, 5800, 7100, 6600, 5900, 7400, 8100, 7600, 6800, 7900, 8500, 7200, 9100, 8700, 7800, 9600, 10200, 9400, 8800, 10500, 11100, 10300, 9700, 11400, 12100, 11500];
const MOCK_REVENUE_90D = [28000, 31000, 29500, 34000, 37000, 33500, 38000, 42000, 40000, 44000, 47000, 45000];
const MOCK_REVENUE_1Y  = [38000, 42000, 45000, 41000, 48000, 52000, 49000, 55000, 58000, 61000, 57000, 64000];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Good night';
}

function getWeekNumber(): number {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function fmtCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

// ─── Studio Status Pill ───────────────────────────────────────────────────────

function fmtHour(hh: number, mm: number): string {
  const suffix = hh >= 12 ? 'p' : 'a';
  const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
  return mm === 0 ? `${h12}${suffix}` : `${h12}:${mm.toString().padStart(2, '0')}${suffix}`;
}

function StudioPill({ businessId }: { businessId: string | undefined }) {
  const { data: hours } = useBusinessHours(businessId);
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay();

  let isOpen = false;
  let hoursLabel = '';

  if (hours) {
    const todayHours = hours.find((d) => d.dayOfWeek === dayOfWeek);
    if (todayHours && !todayHours.isClosed) {
      const [openH, openM] = todayHours.openTime.split(':').map(Number);
      const [closeH, closeM] = todayHours.closeTime.split(':').map(Number);
      isOpen = currentMins >= openH * 60 + openM && currentMins < closeH * 60 + closeM;
      hoursLabel = `${fmtHour(openH, openM)} — ${fmtHour(closeH, closeM)}`;
    }
  } else {
    // Fallback while loading
    isOpen = now.getHours() >= 8 && now.getHours() < 19;
    hoursLabel = '8a — 7p';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 12px',
        borderRadius: 999,
        background: 'var(--m-soft)',
        color: isOpen ? 'var(--m-primary)' : 'var(--m-muted)',
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isOpen ? 'var(--m-ok)' : 'var(--m-faint)',
          flexShrink: 0,
        }}
      />
      {isOpen ? `Open · ${hoursLabel}` : 'Closed'}
    </span>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({
  done,
  total,
  size = 46,
  children,
}: {
  done: number;
  total: number;
  size?: number;
  children?: React.ReactNode;
}) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--m-line2)" strokeWidth={4.5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--m-primary)" strokeWidth={4.5} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11.5, fontWeight: 700, color: 'var(--m-ink)',
          fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        }}
      >
        {children ?? `${done}/${total}`}
      </div>
    </div>
  );
}

// ─── Setup Card ───────────────────────────────────────────────────────────────

function SetupCard() {
  const { checklistDismissed, dismissChecklist, checkedItems, toggleItem, allDone } = useOnboarding();
  const [expanded, setExpanded] = useState(false);

  if (checklistDismissed || allDone) return null;

  const done = checkedItems.size;
  const total = CHECKLIST_ITEMS.length;
  const nextTask = CHECKLIST_ITEMS.find((t) => !checkedItems.has(t.id));

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div
        style={{
          background: 'linear-gradient(160deg, var(--m-soft2), var(--m-surface))',
          border: '1px solid var(--m-soft)',
          borderRadius: 22,
          overflow: 'hidden',
        }}
      >
        {/* Collapsed header row — tap to expand */}
        <button
          className="im-tab im-press"
          onClick={() => setExpanded((e) => !e)}
          style={{
            display: 'flex', alignItems: 'center', gap: 13, padding: 14,
            background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
          }}
        >
          <ProgressRing done={done} total={total} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15, fontWeight: 600, color: 'var(--m-ink)', letterSpacing: -0.2,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              Finish setup
            </div>
            <div
              style={{
                fontSize: 12.5, color: 'var(--m-muted)', marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {nextTask
                ? <>Next: <span style={{ color: 'var(--m-ink2)', fontWeight: 500 }}>{nextTask.label}</span></>
                : 'All set — your practice is ready 🎉'}
            </div>
          </div>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            style={{
              flexShrink: 0, color: 'var(--m-faint)',
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Expanded task list */}
        {expanded && (
          <div style={{ borderTop: '1px solid var(--m-line2)', padding: '4px 12px 8px' }}>
            {CHECKLIST_ITEMS.map((task, i) => {
              const isDone = checkedItems.has(task.id);
              return (
                <button
                  key={task.id}
                  className="im-tab im-press"
                  onClick={() => toggleItem(task.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '11px 4px', background: 'none', border: 'none',
                    borderBottom: i < total - 1 ? '1px solid var(--m-line3)' : 'none',
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 19, height: 19, borderRadius: 10, flexShrink: 0,
                      border: isDone ? 'none' : '2px solid var(--m-line)',
                      background: isDone ? 'var(--m-grad)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isDone && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      flex: 1, fontSize: 13.5, fontWeight: 500,
                      color: isDone ? 'var(--m-muted)' : 'var(--m-ink2)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    }}
                  >
                    {task.label}
                  </span>
                  {!isDone && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="var(--m-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
            <button
              onClick={(e) => { e.stopPropagation(); dismissChecklist(); }}
              style={{
                width: '100%', marginTop: 6, padding: '9px 0',
                border: 'none', background: 'none', color: 'var(--m-muted)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Hide setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string;
  delta: number;
  icon: React.ReactNode;
  deltaTooltip?: string;
  onClick?: () => void;
}

function StatTile({ label, value, delta, icon, deltaTooltip, onClick }: StatTileProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const up = delta >= 0;
  return (
    <button
      className="im-tab im-press"
      onClick={onClick}
      style={{
        background: 'var(--m-surface)',
        borderRadius: 22,
        border: '1px solid var(--m-line2)',
        boxShadow: '0 1px 4px rgba(28,20,54,0.06)',
        padding: '13px 13px',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        minHeight: 44,
      }}
    >
      {/* Icon: unboxed, top-right */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          opacity: 0.45,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--m-muted)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          lineHeight: 1.25,
          paddingRight: 28,
          marginBottom: 6,
        }}
      >
        {label}
      </span>

      {/* Value + delta */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: 'var(--m-ink)',
            lineHeight: 1,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            letterSpacing: -1.2,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {delta !== 0 && (
          <span
            role={deltaTooltip ? 'button' : undefined}
            onClick={deltaTooltip ? (e) => { e.stopPropagation(); setTooltipVisible((v) => !v); } : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 11.5,
              fontWeight: 700,
              color: up ? 'var(--m-ok)' : 'var(--m-accent-dk)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              position: 'relative',
              cursor: deltaTooltip ? 'pointer' : undefined,
            }}
          >
            {up ? '↑' : '↓'} {Math.abs(delta)}%
            {deltaTooltip && tooltipVisible && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '120%',
                  left: 0,
                  background: 'var(--m-ink)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {deltaTooltip}
              </span>
            )}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── SMS Credits Card ─────────────────────────────────────────────────────────

function SmsCreditsCard({
  used,
  total,
  onPress,
}: {
  used: number;
  total: number;
  onPress?: () => void;
}) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <button
        className="im-tab im-press"
        onClick={onPress}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          width: '100%',
          padding: 14,
          background: 'var(--m-surface)',
          border: '1px solid var(--m-line2)',
          borderRadius: 22,
          boxShadow: '0 1px 4px rgba(28,20,54,0.06)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* LEFT — progress ring with SMS icon */}
        <ProgressRing done={used} total={total}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="var(--m-primary)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </ProgressRing>

        {/* MIDDLE — title + subtext */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--m-ink)',
              letterSpacing: -0.2,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              lineHeight: 1.2,
            }}
          >
            SMS credits
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--m-muted)',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            Resets in {daysLeft} day{daysLeft !== 1 ? 's' : ''} · this period
          </div>
        </div>

        {/* RIGHT — usage count */}
        <div
          style={{
            textAlign: 'right',
            flexShrink: 0,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: -0.4,
              lineHeight: 1.1,
            }}
          >
            <span style={{ color: 'var(--m-ink)' }}>{used}</span>
            <span style={{ color: 'var(--m-faint)' }}> / {total}</span>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--m-muted)',
              marginTop: 2,
            }}
          >
            used
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Revenue Card ─────────────────────────────────────────────────────────────

type Period = '30d' | '90d' | '1y';

const PERIOD_DATA: Record<Period, { data: number[]; delta: number }> = {
  '30d': { data: MOCK_REVENUE_30D, delta: 12.4 },
  '90d': { data: MOCK_REVENUE_90D, delta: 18.7 },
  '1y':  { data: MOCK_REVENUE_1Y,  delta: 28.1 },
};

function periodLabels(period: Period): [string, string, string] {
  const now = new Date();
  const fmtMD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtM  = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  if (period === '30d') return [fmtMD(daysAgo(30)), fmtMD(daysAgo(15)), 'Today'];
  if (period === '90d') return [fmtM(daysAgo(90)), fmtM(daysAgo(45)), 'Today'];
  return [fmtM(daysAgo(365)), fmtM(daysAgo(182)), 'Today'];
}

function RevenueCard({ revenueThisMonth, revenueGrowth }: { revenueThisMonth: number; revenueGrowth: number }) {
  const [period, setPeriod] = useState<Period>('30d');
  const { data } = PERIOD_DATA[period];
  const labels = periodLabels(period);
  const displayValue = period === '30d' && revenueThisMonth > 0
    ? revenueThisMonth
    : data[data.length - 1];
  const displayDelta = period === '30d' && revenueGrowth !== 0
    ? revenueGrowth
    : PERIOD_DATA[period].delta;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Card padding="0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: 'var(--m-muted)',
                  marginBottom: 4,
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                }}
              >
                Revenue
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: 'var(--m-ink)',
                    letterSpacing: -1,
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    lineHeight: 1,
                  }}
                >
                  {fmtCurrency(displayValue)}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    padding: '3px 8px',
                    borderRadius: 100,
                    background: 'var(--m-ok-soft)',
                    color: 'var(--m-ok)',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  }}
                >
                  ↑ {displayDelta}%
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                background: 'var(--m-surface)',
                border: '1px solid var(--m-line)',
                borderRadius: 10,
                padding: 3,
                gap: 2,
              }}
            >
              {(['30d', '90d', '1y'] as Period[]).map((p) => (
                <button
                  key={p}
                  className="im-tab"
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    background: period === p ? 'var(--m-grad)' : 'transparent',
                    color: period === p ? '#fff' : 'var(--m-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AreaChart data={data} height={88} color="#5D4AA8" />

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px 16px' }}>
          {labels.map((l) => (
            <span
              key={l}
              style={{
                fontSize: 11,
                color: 'var(--m-muted)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {l}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Service Mix Card ─────────────────────────────────────────────────────────

function ServiceMixCard({ mix, totalSessions }: { mix: MobileServiceSlice[]; totalSessions: number }) {
  if (mix.length === 0) {
    return (
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding="16px">
          <SectionHead title="Service mix" style={{ marginBottom: 12 }} />
          <div
            style={{
              padding: '16px 0',
              textAlign: 'center',
              color: 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              fontSize: 13,
            }}
          >
            No data yet — sessions will appear here once booked.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Card padding="16px">
        <SectionHead title="Service mix" style={{ marginBottom: 16 }} />
        <div
          style={{
            fontSize: 12,
            color: 'var(--m-muted)',
            marginBottom: 14,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          Last 30 days · {totalSessions} sessions
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Donut
            segments={mix.map((s) => ({ value: s.value, color: s.color, label: s.label }))}
            size={120}
            thickness={18}
            centerLabel={
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', lineHeight: 1 }}>
                  {totalSessions}
                </div>
                <div style={{ fontSize: 10, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                  sessions
                </div>
              </div>
            }
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mix.map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 3,
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    color: 'var(--m-ink2)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--m-muted)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  }}
                >
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session, onClick }: { session: MobileSession; onClick?: () => void }) {
  return (
    <button
      className="im-tab im-press"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--m-line2)',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <Avatar name={session.client} size={40} color={session.therapistColor} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--m-ink)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {session.client}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--m-muted)',
            marginTop: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: session.therapistColor, flexShrink: 0 }} />
          {session.service} · {session.therapist}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--m-ink2)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {session.time}
        </span>
        <StatusChip status={session.status} />
      </div>
    </button>
  );
}

// ─── Today's Sessions Card ────────────────────────────────────────────────────

function TodaysSessionsCard({ sessions, onViewAll }: { sessions: MobileSession[]; onViewAll?: () => void }) {
  const displayed = sessions.slice(0, 4);
  const openSlots = Math.max(0, 8 - sessions.length);

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <SectionHead title="Today's sessions" action="View all →" onAction={onViewAll} />
      <Card padding="0" style={{ overflow: 'hidden' }}>
        {displayed.length === 0 ? (
          <button
            className="im-tab im-press"
            onClick={onViewAll}
            style={{
              display: 'block',
              width: '100%',
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--m-primary)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              fontSize: 13,
              fontWeight: 500,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            No sessions today. Book a new session →
          </button>
        ) : (
          displayed.map((s) => (
            <SessionRow key={s.id} session={s} onClick={onViewAll} />
          ))
        )}
        {openSlots > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: 'var(--m-accent-soft)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <polygon points="12,2 15.1,8.5 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.5" stroke="var(--m-accent-dk)" strokeWidth="1.8" fill="none" />
            </svg>
            <span
              style={{
                flex: 1,
                fontSize: 12.5,
                color: 'var(--m-accent-dk)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                lineHeight: 1.35,
              }}
            >
              {openSlots} open slots today. Send a fill-in offer to your waitlist?
            </span>
            <button
              className="im-tab im-press"
              style={{
                padding: '6px 12px',
                borderRadius: 100,
                background: 'var(--m-grad)',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              Send
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── This Week Bars Card ──────────────────────────────────────────────────────

function ThisWeekCard({
  weekBars,
  weekTotal,
  weekTherapistCount,
}: {
  weekBars: WeekBar[];
  weekTotal: number;
  weekTherapistCount: number;
}) {
  const weekNum = getWeekNumber();

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Card padding="16px">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              letterSpacing: -0.3,
            }}
          >
            This week
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            Week {weekNum}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--m-muted)',
            marginBottom: 6,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          {weekTotal} session{weekTotal !== 1 ? 's' : ''}
          {weekTherapistCount > 0 && ` · ${weekTherapistCount} therapist${weekTherapistCount !== 1 ? 's' : ''}`}
          {` · Week ${weekNum}`}
        </div>
        <Bars data={weekBars} height={72} />
      </Card>
    </div>
  );
}

// ─── Install Card ─────────────────────────────────────────────────────────────

function InstallCard() {
  const { isInstalled, canInstall, hasManualInstall, browserType, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDismissed(!!localStorage.getItem('pwa-dashboard-dismissed'));
  }, []);

  const dismiss = () => {
    localStorage.setItem('pwa-dashboard-dismissed', '1');
    setDismissed(true);
  };

  if (isInstalled || dismissed || (!canInstall && !hasManualInstall)) return null;

  const MANUAL_HINT: Partial<Record<typeof browserType, string>> = {
    'ios':             'Tap Share ↑ then "Add to Home Screen"',
    'mac-safari':      'File → Add to Dock in Safari',
    'firefox-android': 'Tap ⋮ then "Install"',
    'chrome-android':  'Tap ⋮ then "Add to Home Screen"',
  };
  const hint = MANUAL_HINT[browserType];

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div
        style={{
          background: 'var(--m-surface)',
          border: '1px solid var(--m-line2)',
          borderRadius: 22,
          boxShadow: '0 1px 4px rgba(28,20,54,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 14px 16px' }}>
          {/* App icon */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: 'var(--m-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="2" width="14" height="20" rx="3" stroke="var(--m-primary)" strokeWidth="1.8" />
              <path d="M12 17v0" stroke="var(--m-primary)" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', lineHeight: 1.2 }}>
              Install Iris app
            </div>
            <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
              {canInstall ? 'Add to home screen for quick access' : hint ?? 'Add to home screen'}
            </div>
          </div>

          {/* Action */}
          {canInstall && (
            <button
              className="im-tab im-press"
              onClick={triggerInstall}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                background: 'var(--m-grad)',
                border: 'none',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              Install
            </button>
          )}
          {!canInstall && hasManualInstall && (
            <button
              className="im-tab im-press"
              onClick={() => setExpanded((v) => !v)}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                background: 'var(--m-soft)',
                border: '1px solid var(--m-line)',
                color: 'var(--m-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {expanded ? 'Hide' : 'How?'}
            </button>
          )}

          {/* Dismiss */}
          <button
            className="im-tab"
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--m-faint)',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Expanded manual steps */}
        {expanded && !canInstall && hasManualInstall && (
          <div
            style={{
              borderTop: '1px solid var(--m-line2)',
              padding: '10px 16px 13px',
              background: 'var(--m-soft2)',
              fontSize: 13,
              color: 'var(--m-ink2)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              lineHeight: 1.6,
            }}
          >
            {browserType === 'ios' && <>Tap the <strong style={{ color: 'var(--m-ink)' }}>Share ↑</strong> button at the bottom of Safari, scroll down and tap <strong style={{ color: 'var(--m-ink)' }}>"Add to Home Screen"</strong>, then tap <strong style={{ color: 'var(--m-ink)' }}>"Add"</strong>.</>}
            {(browserType === 'chrome-android' || browserType === 'firefox-android') && <>Tap the <strong style={{ color: 'var(--m-ink)' }}>⋮ menu</strong> in the top-right corner, then tap <strong style={{ color: 'var(--m-ink)' }}>{browserType === 'firefox-android' ? '"Install"' : '"Add to Home Screen"'}</strong>, then <strong style={{ color: 'var(--m-ink)' }}>"Add"</strong>.</>}
            {browserType === 'mac-safari' && <>Open the <strong style={{ color: 'var(--m-ink)' }}>File</strong> menu in Safari, click <strong style={{ color: 'var(--m-ink)' }}>"Add to Dock…"</strong>, then click <strong style={{ color: 'var(--m-ink)' }}>"Add"</strong>.</>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

export function MobileDashboard({ router }: DashboardProps) {
  const { user } = useAuth();
  const businessId = useBusinessId();
  const {
    sessions,
    clientCount,
    revenueThisMonth,
    revenueGrowth,
    serviceMix,
    serviceMixTotal,
    smsUsed,
    smsTotal,
    weekBars,
    weekTotal,
    weekTherapistCount,
  } = useMobileDashboard(businessId);

  const firstName = user?.user_metadata?.first_name ?? '';
  const greet = greeting();

  const todayDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const sessionCount = sessions.length;

  const revenueDisplay = revenueThisMonth > 0 ? fmtCurrency(revenueThisMonth) : '$0';

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Compact greeting header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '8px 20px 14px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0, fontSize: 23, fontWeight: 700, color: 'var(--m-ink)',
              letterSpacing: -0.6, lineHeight: 1.12,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            {greet}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p
            style={{
              margin: '5px 0 0', fontSize: 13.5, color: 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            {todayDate} · {sessionCount} session{sessionCount !== 1 ? 's' : ''} today
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <StudioPill businessId={businessId} />
          <button
            onClick={() => router.navigate('settings')}
            style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer', color: 'var(--m-muted)', display: 'flex' }}
            aria-label="Settings"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Install Card — shown until dismissed or installed */}
      <InstallCard />

      {/* Setup Card — collapsible */}
      <SetupCard />

      {/* 4.4 Stat Tiles */}
      <div style={{ padding: '0 14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          <StatTile
            label="Today's sessions"
            value={String(sessionCount)}
            delta={sessionCount > 0 ? 15 : 0}
            deltaTooltip="vs last week"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--m-primary)" strokeWidth="1.8" />
                <path d="M8 2v4M16 2v4M3 10h18" stroke="var(--m-primary)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
            onClick={() => router.navigate('appts')}
          />
          <StatTile
            label="Active clients"
            value={clientCount > 0 ? String(clientCount) : '—'}
            delta={clientCount > 0 ? 8 : 0}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="4" stroke="var(--m-primary)" strokeWidth="1.8" />
                <path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke="var(--m-primary)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
            onClick={() => router.navigate('clients')}
          />
          <StatTile
            label="This month"
            value={revenueDisplay}
            delta={revenueGrowth !== 0 ? revenueGrowth : 12}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--m-accent-dk)" strokeWidth="1.8" />
                <path d="M12 6v12M9 9h4.5a1.5 1.5 0 0 1 0 3H9.5a1.5 1.5 0 0 0 0 3H15" stroke="var(--m-accent-dk)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
            onClick={() => router.navigate('payments')}
          />
          <StatTile
            label="Pending forms"
            value="—"
            delta={0}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="8" y="2" width="8" height="4" rx="1" stroke="var(--m-primary)" strokeWidth="1.8" />
                <path d="M8 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" stroke="var(--m-primary)" strokeWidth="1.8" />
                <path d="M9 12h6M9 16h4" stroke="var(--m-primary)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </div>

      {/* 4.5 SMS Credits Card */}
      <SmsCreditsCard used={smsUsed} total={smsTotal} onPress={() => router.navigate('settings')} />

      {/* 4.6 Revenue Card */}
      <RevenueCard revenueThisMonth={revenueThisMonth} revenueGrowth={revenueGrowth} />

      {/* 4.7 Service Mix Card */}
      <ServiceMixCard mix={serviceMix} totalSessions={serviceMixTotal} />

      {/* 4.8 Today's Sessions List */}
      <TodaysSessionsCard sessions={sessions} onViewAll={() => router.navigate('appts')} />

      {/* 4.9 This Week Bars Card */}
      <ThisWeekCard weekBars={weekBars} weekTotal={weekTotal} weekTherapistCount={weekTherapistCount} />
    </div>
  );
}
