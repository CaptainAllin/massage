'use client';

import React, { useState } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Card, SectionHead, Chip } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useGiftCards } from '@/lib/hooks/use-gift-cards';
import type { MobileRouter } from '../MobileShell';

interface MobileGiftCardsProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type GCFilter = 'ALL' | 'ACTIVE' | 'REDEEMED' | 'EXPIRED';

const GC_FILTERS: Array<{ key: GCFilter; label: string }> = [
  { key: 'ALL',      label: 'All' },
  { key: 'ACTIVE',   label: 'Active' },
  { key: 'REDEEMED', label: 'Redeemed' },
  { key: 'EXPIRED',  label: 'Expired' },
];

function fmtCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function gcStatus(card: any): GCFilter {
  if (card.redeemedAt) return 'REDEEMED';
  if (card.expiresAt && new Date(card.expiresAt) < new Date()) return 'EXPIRED';
  return 'ACTIVE';
}

const STATUS_STYLES: Record<GCFilter, { label: string; color: string; bg: string }> = {
  ALL:      { label: 'All',      color: 'var(--m-muted)',    bg: 'var(--m-soft)' },
  ACTIVE:   { label: 'Active',   color: 'var(--m-ok)',       bg: 'rgba(62,158,122,0.12)' },
  REDEEMED: { label: 'Redeemed', color: 'var(--m-muted)',    bg: 'var(--m-soft)' },
  EXPIRED:  { label: 'Expired',  color: 'var(--m-warn)',     bg: 'rgba(222,146,119,0.12)' },
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRect({ width = '100%', height = 16, radius = 8, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="im-skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

// ─── Gift Card Row ────────────────────────────────────────────────────────────

function GiftCardRow({ card, last }: { card: any; last: boolean }) {
  const status = gcStatus(card);
  const cfg = STATUS_STYLES[status];
  const recipient = card.recipientName || card.recipientEmail || 'Unknown recipient';
  const maskedCode = card.code ? `•••• ${card.code.slice(-4)}` : '—';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : '1px solid var(--m-line2)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--m-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        💳
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {recipient}
        </div>
        <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {maskedCode} · {card.expiresAt ? `Exp ${fmtDate(card.expiresAt)}` : 'No expiry'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {fmtCurrency(card.balance ?? card.originalAmount ?? 0)}
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 7px', borderRadius: 7, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MobileGiftCards({ router: _router }: MobileGiftCardsProps) {
  const businessId = useBusinessId();
  const [filter, setFilter] = useState<GCFilter>('ALL');

  const { data: allCards, isLoading } = useGiftCards(businessId, {});
  const cards: any[] = Array.isArray(allCards) ? allCards : [];

  const filtered = filter === 'ALL' ? cards : cards.filter((c) => gcStatus(c) === filter);

  const activeCards = cards.filter((c) => gcStatus(c) === 'ACTIVE');
  const totalValue = activeCards.reduce((s, c) => s + (c.balance ?? c.originalAmount ?? 0), 0);
  const redeemedCount = cards.filter((c) => gcStatus(c) === 'REDEEMED').length;

  return (
    <div style={{ padding: '20px 0 8px' }}>
      <LargeHeader eyebrow="Growth" title="Gift Cards" style={{ padding: '0 16px 16px' }} />

      {/* Hero */}
      <div style={{ padding: '0 16px', marginBottom: 18 }}>
        <div style={{ position: 'relative', borderRadius: 22, background: 'var(--m-grad-hero)', padding: '22px 20px 20px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(222,146,119,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            Outstanding value
          </div>
          {isLoading ? (
            <SkeletonRect width={140} height={36} radius={10} style={{ background: 'rgba(255,255,255,0.25)', marginBottom: 18 }} />
          ) : (
            <div style={{ color: '#fff', fontSize: 36, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 18 }}>
              {fmtCurrency(totalValue)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Active cards', value: isLoading ? '—' : activeCards.length.toString() },
              { label: 'Total issued', value: isLoading ? '—' : cards.length.toString() },
              { label: 'Redeemed',     value: isLoading ? '—' : redeemedCount.toString() },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, paddingLeft: i > 0 ? 10 : 0, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.18)' : 'none', marginLeft: i > 0 ? 10 : 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 3 }}>{s.label}</div>
                <div style={{ color: '#fff', fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 16, overflowX: 'auto' }}>
        {GC_FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onClick={() => setFilter(f.key)} />
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        <SectionHead title="Gift cards" style={{ marginBottom: 10 }} />

        {isLoading ? (
          <Card style={{ padding: '0 16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i < 3 ? '1px solid var(--m-line2)' : 'none' }}>
                <SkeletonRect width={38} height={38} radius={12} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <SkeletonRect width="50%" height={13} />
                  <SkeletonRect width="70%" height={10} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <SkeletonRect width={50} height={16} />
                  <SkeletonRect width={48} height={18} radius={7} />
                </div>
              </div>
            ))}
          </Card>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--m-surface)', borderRadius: 22, border: '1px solid var(--m-line2)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💳</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 4 }}>
              {filter === 'ALL' ? 'No gift cards yet' : `No ${filter.toLowerCase()} cards`}
            </div>
            <div style={{ fontSize: 13, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
              Issue gift cards to clients from the desktop dashboard
            </div>
          </div>
        ) : (
          <Card style={{ padding: '0 16px' }}>
            {filtered.map((c: any, i: number) => (
              <GiftCardRow key={c.id} card={c} last={i === filtered.length - 1} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
