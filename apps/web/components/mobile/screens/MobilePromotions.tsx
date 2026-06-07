'use client';

import React, { useState } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Card, SectionHead, Chip, StatusChip } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { usePromotions, type Promotion } from '@/lib/hooks/use-promotions';
import type { MobileRouter } from '../MobileShell';

interface MobilePromotionsProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type StatusFilter = 'ALL' | 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'ALL',       label: 'All' },
  { key: 'DRAFT',     label: 'Draft' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'SENT',      label: 'Sent' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_CHIP_MAP: Record<string, string> = {
  DRAFT: 'scheduled', SCHEDULED: 'confirmed', SENDING: 'in_progress',
  SENT: 'completed', CANCELLED: 'cancelled',
};

const CHANNEL_ICON: Record<string, string> = {
  EMAIL: '✉️', SMS: '💬', WHATSAPP: '📱',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRect({ width = '100%', height = 16, radius = 8, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="im-skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

// ─── Promotion Row ────────────────────────────────────────────────────────────

function PromotionRow({ promo, last }: { promo: Promotion; last: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--m-line2)' }}>
      <button
        className="im-tab im-press"
        onClick={() => setExpanded((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--m-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {CHANNEL_ICON[promo.channel] ?? '📣'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {promo.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            {promo.sentAt ? `Sent ${fmtDate(promo.sentAt)}` : promo.scheduledFor ? `Scheduled ${fmtDate(promo.scheduledFor)}` : 'Draft'}
          </div>
        </div>
        <StatusChip status={STATUS_CHIP_MAP[promo.status] ?? 'scheduled'} />
      </button>

      {expanded && promo.status === 'SENT' && (
        <div style={{ display: 'flex', gap: 0, padding: '0 0 14px', paddingLeft: 50 }}>
          {[
            { label: 'Sent', value: promo.totalSent },
            { label: 'Opened', value: `${fmtPct(promo.totalSent > 0 ? (promo.totalOpened / promo.totalSent) * 100 : 0)}` },
            { label: 'Clicked', value: `${fmtPct(promo.totalSent > 0 ? (promo.totalClicked / promo.totalSent) * 100 : 0)}` },
            { label: 'Converted', value: `${fmtPct(promo.totalSent > 0 ? (promo.totalConverted / promo.totalSent) * 100 : 0)}` },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, paddingLeft: i > 0 ? 10 : 0, borderLeft: i > 0 ? '1px solid var(--m-line2)' : 'none', marginLeft: i > 0 ? 10 : 0 }}>
              <div style={{ fontSize: 10.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MobilePromotions({ router: _router }: MobilePromotionsProps) {
  const businessId = useBusinessId();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const queryFilters = statusFilter === 'ALL' ? {} : { status: statusFilter };
  const { data: promotions, isLoading } = usePromotions(businessId, queryFilters);

  const all: Promotion[] = Array.isArray(promotions) ? promotions : (promotions as any)?.data ?? [];
  const totalSent = all.reduce((s, p) => s + (p.totalSent ?? 0), 0);
  const sentCount = all.filter((p) => p.status === 'SENT').length;
  const draftCount = all.filter((p) => p.status === 'DRAFT').length;

  return (
    <div style={{ padding: '20px 0 8px' }}>
      <LargeHeader eyebrow="Growth" title="Promotions" style={{ padding: '0 16px 16px' }} />

      {/* Hero */}
      <div style={{ padding: '0 16px', marginBottom: 18 }}>
        <Card style={{ padding: '16px', display: 'flex', gap: 0 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', letterSpacing: -0.8 }}>
              {isLoading ? '—' : sentCount}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 2 }}>Sent</div>
          </div>
          <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 16px' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', letterSpacing: -0.8 }}>
              {isLoading ? '—' : totalSent.toLocaleString()}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 2 }}>Msgs delivered</div>
          </div>
          <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 16px' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: draftCount > 0 ? 'var(--m-primary)' : 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', letterSpacing: -0.8 }}>
              {isLoading ? '—' : draftCount}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 2 }}>Draft</div>
          </div>
        </Card>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 16, overflowX: 'auto' }}>
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={statusFilter === f.key} onClick={() => setStatusFilter(f.key)} />
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        <SectionHead title="Campaigns" style={{ marginBottom: 10 }} />

        {isLoading ? (
          <Card style={{ padding: '0 16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i < 3 ? '1px solid var(--m-line2)' : 'none' }}>
                <SkeletonRect width={38} height={38} radius={12} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <SkeletonRect width="60%" height={13} />
                  <SkeletonRect width="35%" height={10} />
                </div>
                <SkeletonRect width={64} height={22} radius={11} />
              </div>
            ))}
          </Card>
        ) : all.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--m-surface)', borderRadius: 22, border: '1px solid var(--m-line2)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎁</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 4 }}>No promotions yet</div>
            <div style={{ fontSize: 13, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Create your first campaign to re-engage clients</div>
          </div>
        ) : (
          <Card style={{ padding: '0 16px' }}>
            {all.map((p, i) => (
              <PromotionRow key={p.id} promo={p} last={i === all.length - 1} />
            ))}
          </Card>
        )}

        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--m-soft)', fontSize: 12.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', lineHeight: 1.5 }}>
          To create and send new promotions, use the full editor on desktop.
        </div>
      </div>
    </div>
  );
}
