'use client';

import React from 'react';
import { LargeHeader } from '../LargeHeader';
import { Avatar, Card, SectionHead } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { usePayments, usePaymentStats } from '@/lib/hooks/use-payments';
import type { MobileRouter } from '../MobileShell';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MobilePaymentsProps {
  router: MobileRouter;
  param: unknown;
}

type TxStatus = 'paid' | 'pending' | 'refunded';

interface Transaction {
  id: string;
  client: string;
  service: string;
  timestamp: string;
  amount: number;
  status: TxStatus;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

function mapStatus(s: string): TxStatus {
  const lower = s.toLowerCase();
  if (lower === 'completed') return 'paid';
  if (lower === 'refunded' || lower === 'partially_refunded') return 'refunded';
  return 'pending';
}

function fmtTimestamp(d: Date | null): string {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 0) return `Today · ${timeStr}`;
  if (diffDays === 1) return `Yesterday · ${timeStr}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` · ${timeStr}`;
}

function mapPayment(p: any): Transaction {
  const clientName = p.client
    ? `${p.client.firstName ?? ''} ${p.client.lastName ?? ''}`.trim()
    : p.clientName ?? 'Unknown';

  return {
    id: p.id,
    client: clientName || 'Unknown',
    service: p.description ?? p.serviceType ?? 'Service',
    timestamp: fmtTimestamp(p.paidAt ?? p.createdAt),
    amount: p.amount ?? 0,
    status: mapStatus(p.status ?? ''),
  };
}

// ─── Status label & color ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<TxStatus, { label: string; color: string }> = {
  paid:     { label: 'Paid',     color: 'var(--m-ok)' },
  pending:  { label: 'Pending',  color: 'var(--m-warn)' },
  refunded: { label: 'Refunded', color: 'var(--m-muted)' },
};

// ─── Skeleton helpers ────────────────────────────────────────────────────────

function SkeletonRect({ width = '100%', height = 16, radius = 8, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="im-skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

function HeroSkeleton() {
  return (
    <div style={{ borderRadius: 22, background: 'var(--m-grad-hero)', padding: '24px 20px 22px', margin: '0 0 14px', opacity: 0.7 }}>
      <SkeletonRect width={120} height={11} radius={6} style={{ background: 'rgba(255,255,255,0.25)', marginBottom: 12 }} />
      <SkeletonRect width={160} height={36} radius={10} style={{ background: 'rgba(255,255,255,0.3)', marginBottom: 22 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1 }}>
            <SkeletonRect width="70%" height={9} radius={5} style={{ background: 'rgba(255,255,255,0.2)', marginBottom: 7 }} />
            <SkeletonRect width="80%" height={16} radius={7} style={{ background: 'rgba(255,255,255,0.25)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

interface HeroCardProps {
  todayTotal: number;
  weekTotal: number;
  pending: number;
  refunded: number;
  statsLoading?: boolean;
}

function HeroCard({ todayTotal, weekTotal, pending, refunded, statsLoading }: HeroCardProps) {
  if (statsLoading) return <HeroSkeleton />;
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 22,
        background: 'var(--m-grad-hero)',
        padding: '24px 20px 20px',
        overflow: 'hidden',
        margin: '0 0 14px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(222,146,119,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
        Collected today
      </div>
      <div style={{ color: '#fff', fontSize: 38, fontWeight: 700, lineHeight: 1, letterSpacing: -1.5, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 20 }}>
        {fmtCurrency(todayTotal)}
      </div>

      <div style={{ display: 'flex', gap: 0 }}>
        {[
          { label: 'This week', value: fmtCurrency(weekTotal) },
          { label: 'Pending',   value: fmtCurrency(pending) },
          { label: 'Refunds',   value: fmtCurrency(refunded) },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              paddingLeft: i > 0 ? 12 : 0,
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.18)' : 'none',
              marginLeft: i > 0 ? 12 : 0,
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 3 }}>
              {stat.label}
            </div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ tx, last }: { tx: Transaction; last: boolean }) {
  const { label, color } = STATUS_STYLES[tx.status];
  const isRefunded = tx.status === 'refunded';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: last ? 'none' : '1px solid var(--m-line2)',
      }}
    >
      <Avatar name={tx.client} size={42} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--m-ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tx.client}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            fontSize: 12,
            color: 'var(--m-muted)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tx.service} · {tx.timestamp}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            fontSize: 15,
            fontWeight: 700,
            color: isRefunded ? 'var(--m-muted)' : 'var(--m-ink)',
            textDecoration: isRefunded ? 'line-through' : 'none',
          }}
        >
          {fmtCurrency(tx.amount)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            fontSize: 11,
            fontWeight: 600,
            color,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MobilePayments({ router }: MobilePaymentsProps) {
  const businessId = useBusinessId();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Use start of next day as the upper bound so lte covers all of today
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const { data: paymentsResponse, isLoading } = usePayments(businessId, { limit: 20 });
  const { data: statsToday, isLoading: statsTodayLoading } = usePaymentStats(businessId, todayStr, tomorrowStr);
  const { data: statsWeek, isLoading: statsWeekLoading } = usePaymentStats(businessId, weekStartStr, tomorrowStr);

  const statsLoading = statsTodayLoading || statsWeekLoading;

  const rawPayments = (paymentsResponse as any)?.data ?? [];
  const transactions: Transaction[] = Array.isArray(rawPayments)
    ? rawPayments.map(mapPayment)
    : [];

  const byStatus = (statsToday as any)?.byStatus ?? {};
  const todayCollected = byStatus['COMPLETED']?.total ?? 0;

  const weekByStatus = (statsWeek as any)?.byStatus ?? {};
  const weekTotal   = weekByStatus['COMPLETED']?.total ?? 0;
  const weekPending = weekByStatus['PENDING']?.total ?? 0;
  const weekRefunded = (weekByStatus['REFUNDED']?.total ?? 0) + (weekByStatus['PARTIALLY_REFUNDED']?.total ?? 0);

  const totalCollected = transactions.filter((t) => t.status === 'paid').reduce((s, t) => s + t.amount, 0);
  const pendingCount   = transactions.filter((t) => t.status === 'pending').length;

  return (
    <div style={{ padding: '20px 16px 8px' }}>
      <LargeHeader
        eyebrow="Finance"
        title="Payments"
        subtitle={statsLoading ? undefined : `${fmtCurrency(totalCollected)} collected · ${pendingCount} pending`}
      />

      <HeroCard
        todayTotal={todayCollected}
        weekTotal={weekTotal}
        pending={weekPending}
        refunded={weekRefunded}
        statsLoading={statsLoading}
      />

      <SectionHead
        title="Recent transactions"
        action="Exports →"
        onAction={() => router.navigate('payments')}
      />

      {isLoading ? (
        <Card style={{ padding: '0 16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i < 4 ? '1px solid var(--m-line2)' : 'none' }}>
              <SkeletonRect width={42} height={42} radius={21} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SkeletonRect width="50%" height={13} />
                <SkeletonRect width="35%" height={10} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                <SkeletonRect width={48} height={14} />
                <SkeletonRect width={34} height={10} />
              </div>
            </div>
          ))}
        </Card>
      ) : transactions.length === 0 ? (
        <div
          style={{
            padding: '32px 20px',
            textAlign: 'center',
            background: 'var(--m-surface)',
            borderRadius: 22,
            border: '1px solid var(--m-line2)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 4 }}>
            No transactions yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', lineHeight: 1.5 }}>
            Payments you collect will appear here
          </div>
        </div>
      ) : (
        <Card style={{ padding: '0 16px' }}>
          {transactions.map((tx, i) => (
            <TransactionRow key={tx.id} tx={tx} last={i === transactions.length - 1} />
          ))}
        </Card>
      )}
    </div>
  );
}
