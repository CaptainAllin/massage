'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@massage/auth';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBentoDashboard } from '@/lib/hooks/use-bento-dashboard';
import { useBusinessHours } from '@/lib/hooks/use-business-hours';
import { useOnboarding, CHECKLIST_ITEMS } from '@/lib/hooks/use-onboarding';
import {
  CapacityGauge,
  StatNumber,
  ScheduleList,
  WeekBars,
  BusiestHeatmap,
  TopServicesBars,
} from '@/components/dashboard';
import type { MobileRouter } from '../MobileShell';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Good night';
}

function fmtHour(hh: number, mm: number): string {
  const suffix = hh >= 12 ? 'p' : 'a';
  const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
  return mm === 0 ? `${h12}${suffix}` : `${h12}:${mm.toString().padStart(2, '0')}${suffix}`;
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Studio Status Pill ───────────────────────────────────────────────────────

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
    <div style={{ padding: '0 14px 14px' }}>
      <div
        style={{
          background: 'linear-gradient(160deg, var(--m-soft2), var(--m-surface))',
          border: '1px solid var(--m-soft)',
          borderRadius: 22,
          overflow: 'hidden',
        }}
      >
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
    <div style={{ padding: '0 14px 14px' }}>
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
          <div
            style={{
              width: 42, height: 42, borderRadius: 13,
              background: 'var(--m-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="2" width="14" height="20" rx="3" stroke="var(--m-primary)" strokeWidth="1.8" />
              <path d="M12 17v0" stroke="var(--m-primary)" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', lineHeight: 1.2 }}>
              Install Iris app
            </div>
            <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
              {canInstall ? 'Add to home screen for quick access' : hint ?? 'Add to home screen'}
            </div>
          </div>

          {canInstall && (
            <button
              className="im-tab im-press"
              onClick={triggerInstall}
              style={{
                padding: '7px 14px', borderRadius: 10,
                background: 'var(--m-grad)', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', flexShrink: 0,
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
                padding: '7px 14px', borderRadius: 10,
                background: 'var(--m-soft)', border: '1px solid var(--m-line)',
                color: 'var(--m-primary)', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', flexShrink: 0,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {expanded ? 'Hide' : 'How?'}
            </button>
          )}

          <button
            className="im-tab"
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--m-faint)', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {expanded && !canInstall && hasManualInstall && (
          <div
            style={{
              borderTop: '1px solid var(--m-line2)',
              padding: '10px 16px 13px',
              background: 'var(--m-soft2)',
              fontSize: 13, color: 'var(--m-ink2)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              lineHeight: 1.6,
            }}
          >
            {browserType === 'ios' && <>Tap the <strong style={{ color: 'var(--m-ink)' }}>Share ↑</strong> button at the bottom of Safari, scroll down and tap <strong style={{ color: 'var(--m-ink)' }}>&quot;Add to Home Screen&quot;</strong>, then tap <strong style={{ color: 'var(--m-ink)' }}>&quot;Add&quot;</strong>.</>}
            {(browserType === 'chrome-android' || browserType === 'firefox-android') && <>Tap the <strong style={{ color: 'var(--m-ink)' }}>⋮ menu</strong> in the top-right corner, then tap <strong style={{ color: 'var(--m-ink)' }}>{browserType === 'firefox-android' ? '"Install"' : '"Add to Home Screen"'}</strong>, then <strong style={{ color: 'var(--m-ink)' }}>&quot;Add&quot;</strong>.</>}
            {browserType === 'mac-safari' && <>Open the <strong style={{ color: 'var(--m-ink)' }}>File</strong> menu in Safari, click <strong style={{ color: 'var(--m-ink)' }}>&quot;Add to Dock…&quot;</strong>, then click <strong style={{ color: 'var(--m-ink)' }}>&quot;Add&quot;</strong>.</>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonBlock({ height, marginBottom = 14 }: { height: number; marginBottom?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{
        height,
        background: '#F1EEF6',
        borderRadius: 22,
        margin: `0 14px ${marginBottom}px`,
      }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <>
      <SkeletonBlock height={148} />
      <SkeletonBlock height={78} />
      <SkeletonBlock height={230} />
      <SkeletonBlock height={138} />
      <SkeletonBlock height={146} />
      <SkeletonBlock height={162} />
      <SkeletonBlock height={80} marginBottom={0} />
    </>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div
        style={{
          background: 'var(--m-surface)',
          borderRadius: 22,
          border: '1px solid #F1EEF6',
          boxShadow: '0 1px 2px rgba(30,24,48,0.04)',
          padding: 16,
          ...style,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#1E1830',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            marginBottom: 14,
          }}
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

export function MobileDashboard({ router }: DashboardProps) {
  const { user } = useAuth();
  const businessId = useBusinessId();
  const {
    isLoading,
    todayAppointments,
    collectedToday,
    avgPerVisit,
    newClientsThisWeek,
    rebookedRate,
    noShowsThisWeek,
    dueBack,
    weekBars,
    busiestHeatmap,
    topServices,
    capacityBooked,
    capacityTotal,
  } = useBentoDashboard(businessId);

  const firstName = user?.user_metadata?.first_name ?? '';
  const greet = greeting();
  const todayDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
  const todayDayIndex = (new Date().getDay() + 6) % 7;

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Greeting header */}
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
            {todayDate}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <StudioPill businessId={businessId} />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* 3.2 Bento row — CapacityGauge + StatNumber pair */}
          <div style={{ padding: '0 14px 14px', display: 'flex', gap: 10, alignItems: 'stretch' }}>
            {/* Left tile (55): CapacityGauge */}
            <div
              style={{
                flex: '55 1 0',
                background: 'var(--m-surface)',
                borderRadius: 22,
                border: '1px solid #F1EEF6',
                boxShadow: '0 1px 2px rgba(30,24,48,0.04)',
                padding: '18px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CapacityGauge booked={capacityBooked} capacity={capacityTotal} />
            </div>

            {/* Right tile (45): two stacked StatNumbers */}
            <div
              style={{
                flex: '45 1 0',
                background: 'var(--m-surface)',
                borderRadius: 22,
                border: '1px solid #F1EEF6',
                boxShadow: '0 1px 2px rgba(30,24,48,0.04)',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <StatNumber
                label="Collected today"
                value={fmtUSD(collectedToday)}
                sub={`avg ${fmtUSD(avgPerVisit)} / visit`}
              />
              <div style={{ borderTop: '1px solid #F4F3F8', paddingTop: 12, marginTop: 12 }}>
                <StatNumber
                  label="New clients"
                  value={newClientsThisWeek}
                  sub="this week"
                />
              </div>
            </div>
          </div>

          {/* 3.3 KPI strip */}
          <div style={{ padding: '0 14px 14px' }}>
            <div
              style={{
                background: 'var(--m-surface)',
                borderRadius: 22,
                border: '1px solid #F1EEF6',
                boxShadow: '0 1px 2px rgba(30,24,48,0.04)',
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              <div style={{ flex: 1, padding: '14px 10px', display: 'flex', justifyContent: 'center' }}>
                <StatNumber label="Rebooked" value={`${Math.round(rebookedRate)}%`} />
              </div>
              <div style={{ width: 1, background: '#F1EEF6', flexShrink: 0 }} />
              <div style={{ flex: 1, padding: '14px 10px', display: 'flex', justifyContent: 'center' }}>
                <StatNumber label="No-shows" value={noShowsThisWeek} />
              </div>
              <div style={{ width: 1, background: '#F1EEF6', flexShrink: 0 }} />
              <div style={{ flex: 1, padding: '14px 10px', display: 'flex', justifyContent: 'center' }}>
                <StatNumber label="Due back" value={dueBack} />
              </div>
            </div>
          </div>

          {/* 3.4 Schedule List — dropped directly, no wrapper card */}
          <div style={{ padding: '0 14px 14px' }}>
            <ScheduleList
              appointments={todayAppointments}
              onViewAll={() => router.navigate('appts')}
            />
          </div>

          {/* 3.5 WeekBars section */}
          <SectionCard title="This week">
            <WeekBars bars={weekBars} height={100} />
          </SectionCard>

          {/* 3.6 BusiestHeatmap section */}
          <SectionCard title="When it's busy" style={{ overflowX: 'hidden' }}>
            <BusiestHeatmap cells={busiestHeatmap} todayDayIndex={todayDayIndex} />
          </SectionCard>

          {/* 3.7 TopServicesBars section */}
          <SectionCard title="Service mix">
            <TopServicesBars services={topServices} />
          </SectionCard>

          {/* SetupCard and InstallCard de-emphasized at the bottom */}
          <SetupCard />
          <InstallCard />
        </>
      )}
    </div>
  );
}
