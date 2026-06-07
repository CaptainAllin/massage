'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@massage/auth';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness } from '@/lib/hooks/use-business';
import { useBentoDashboard } from '@/lib/hooks/use-bento-dashboard';
import { formatCurrency } from '@/lib/format';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { CHECKLIST_ITEMS, ChecklistItemId } from '@/lib/hooks/use-onboarding';
import { TeamAdoptionCards } from '@/components/onboarding/TeamAdoptionCards';
import {
  CapacityGauge,
  StatNumber,
  ScheduleList,
  WeekBars,
  BusiestHeatmap,
  TopServicesBars,
} from '@/components/dashboard';

// ── Setup card slim ───────────────────────────────────────────────────────────

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

      <div className="flex gap-1.5 mb-4">
        {CHECKLIST_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex-1 rounded-full transition-all duration-300"
            style={{ height: 4, background: checkedItems.has(item.id) ? '#5D4AA8' : '#EDE5F4' }}
          />
        ))}
      </div>

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

// ── SMS Credits Widget ────────────────────────────────────────────────────────

function SmsCreditWidget({ smsCredits }: { smsCredits: { isUnlimited: boolean; isExhausted: boolean; isNearLimit: boolean; percentUsed: number; creditsUsed: number; creditsIncluded: number; creditsRemaining: number } | undefined }) {
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

// ── Loading skeletons ─────────────────────────────────────────────────────────

function SkeletonBlock({ height, className }: { height: number; className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${className ?? ''}`}
      style={{ height, background: '#F1EEF6' }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
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

  const {
    isLoading,
    todayAppointments,
    collectedToday,
    avgPerVisit,
    newClientsThisWeek,
    rebookedRate,
    noShowsThisWeek,
    dueBack,
    capacityBooked,
    capacityTotal,
    weekBars,
    busiestHeatmap,
    topServices,
  } = useBentoDashboard(businessId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const todayDayIndex = (new Date().getDay() + 6) % 7;

  const fmtMoney = (n: number) =>
    formatCurrency(n, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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
              : `${dayName}, ${dateStr}`}
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

      {/* ── Setup card slim ── */}
      {loaded && !checklistDismissed && !allDone && (
        <SetupCardSlim
          checkedItems={checkedItems}
          onToggle={toggleItem}
          onDismiss={dismissChecklist}
        />
      )}

      {/* ── Team adoption cards ── */}
      {loaded && congratsShown && (
        <TeamAdoptionCards
          dismissedCards={dismissedAdoptionCards}
          onDismiss={dismissAdoptionCard}
        />
      )}

      {isLoading ? (
        /* ── Loading skeletons ── */
        <div className="space-y-5">
          <SkeletonBlock height={120} />
          <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)' }}>
            <SkeletonBlock height={420} />
            <div className="space-y-4">
              <SkeletonBlock height={160} />
              <SkeletonBlock height={248} />
            </div>
          </div>
          <SkeletonBlock height={160} />
        </div>
      ) : (
        <>
          {/* ── 4.1 Top band ── */}
          <div
            className="rounded-2xl"
            style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)', padding: '20px 24px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 28, alignItems: 'center' }}>
              {/* Left: capacity gauge */}
              <CapacityGauge booked={capacityBooked} capacity={capacityTotal} size={80} />

              {/* Right: two rows of 3 stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Row A */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
                  <div style={{ paddingRight: 20, borderRight: '1px solid #F1EEF6' }}>
                    <StatNumber
                      label="Collected today"
                      value={fmtMoney(collectedToday)}
                      sub={avgPerVisit > 0 ? `avg ${fmtMoney(avgPerVisit)} / visit` : undefined}
                    />
                  </div>
                  <div style={{ padding: '0 20px', borderRight: '1px solid #F1EEF6' }}>
                    <StatNumber
                      label="Avg per visit"
                      value={avgPerVisit > 0 ? fmtMoney(avgPerVisit) : '—'}
                    />
                  </div>
                  <div style={{ paddingLeft: 20 }}>
                    <StatNumber
                      label="New clients (week)"
                      value={newClientsThisWeek}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#F1EEF6' }} />

                {/* Row B */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
                  <div style={{ paddingRight: 20, borderRight: '1px solid #F1EEF6' }}>
                    <StatNumber
                      label="Rebooked"
                      value={`${rebookedRate}%`}
                    />
                  </div>
                  <div style={{ padding: '0 20px', borderRight: '1px solid #F1EEF6' }}>
                    <StatNumber
                      label="No-shows"
                      value={noShowsThisWeek}
                    />
                  </div>
                  <div style={{ paddingLeft: 20 }}>
                    <StatNumber
                      label="Due back"
                      value={dueBack}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4.2 Two-column region ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: 20 }}>
            {/* Left: schedule */}
            <div
              className="rounded-2xl"
              style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
            >
              <ScheduleList
                appointments={todayAppointments}
                onViewAll={() => router.push('/appointments')}
                maxVisible={8}
              />
            </div>

            {/* Right: week bars + heatmap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                className="rounded-2xl p-5"
                style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
              >
                <p className="mb-3" style={{ fontSize: '13px', fontWeight: 600, color: '#1E1830' }}>This week</p>
                <WeekBars bars={weekBars} height={100} />
              </div>

              <div
                className="rounded-2xl p-5"
                style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
              >
                <p className="mb-3" style={{ fontSize: '13px', fontWeight: 600, color: '#1E1830' }}>When it&apos;s busy</p>
                <BusiestHeatmap cells={busiestHeatmap} todayDayIndex={todayDayIndex} />
              </div>
            </div>
          </div>

          {/* ── 4.3 Full-width row: service mix ── */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
          >
            <p className="mb-4" style={{ fontSize: '13px', fontWeight: 600, color: '#1E1830' }}>Service mix — this month</p>
            <TopServicesBars services={topServices} />
          </div>

          {/* ── SMS credits ── */}
          {businessId && <SmsCreditWidget smsCredits={(business as any)?.smsCredits} />}
        </>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
