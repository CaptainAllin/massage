'use client';

import React, { useState } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Avatar, Card, SectionHead, Chip } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useLoyaltyAccounts, useLoyaltySettings } from '@/lib/hooks/use-loyalty';
import type { MobileRouter } from '../MobileShell';

interface MobileLoyaltyProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string }> = {
  BRONZE:   { label: 'Bronze',   color: '#92400E', bg: '#FEF3C7' },
  SILVER:   { label: 'Silver',   color: '#374151', bg: '#F3F4F6' },
  GOLD:     { label: 'Gold',     color: '#78350F', bg: '#FEF9C3' },
  PLATINUM: { label: 'Platinum', color: '#1E40AF', bg: '#DBEAFE' },
};

function tierFor(points: number, settings: any): Tier {
  if (!settings) return 'BRONZE';
  if (points >= (settings.platinumMinPoints ?? 5000)) return 'PLATINUM';
  if (points >= (settings.goldMinPoints ?? 1500))     return 'GOLD';
  if (points >= (settings.silverMinPoints ?? 500))    return 'SILVER';
  return 'BRONZE';
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRect({ width = '100%', height = 16, radius = 8, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="im-skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

// ─── Member Row ──────────────────────────────────────────────────────────────

function MemberRow({ account, settings, last }: { account: any; settings: any; last: boolean }) {
  const name = account.client
    ? `${account.client.firstName ?? ''} ${account.client.lastName ?? ''}`.trim() || 'Unknown'
    : 'Unknown';
  const points: number = account.currentPoints ?? 0;
  const tier = tierFor(points, settings);
  const cfg = TIER_CONFIG[tier];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : '1px solid var(--m-line2)' }}>
      <Avatar name={name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--m-muted)', marginTop: 2, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {points.toLocaleString()} pts
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 9px', borderRadius: 8, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type TierFilter = 'ALL' | Tier;

const TIER_FILTERS: Array<{ key: TierFilter; label: string }> = [
  { key: 'ALL',      label: 'All' },
  { key: 'PLATINUM', label: 'Platinum' },
  { key: 'GOLD',     label: 'Gold' },
  { key: 'SILVER',   label: 'Silver' },
  { key: 'BRONZE',   label: 'Bronze' },
];

export function MobileLoyalty({ router: _router }: MobileLoyaltyProps) {
  const businessId = useBusinessId();
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');

  const { data: accounts, isLoading: accLoading } = useLoyaltyAccounts(businessId);
  const { data: settings, isLoading: settLoading } = useLoyaltySettings(businessId);
  const isLoading = accLoading || settLoading;

  const allAccounts: any[] = Array.isArray(accounts) ? accounts : [];
  const filtered = tierFilter === 'ALL' ? allAccounts : allAccounts.filter((a) => tierFor(a.currentPoints ?? 0, settings) === tierFilter);

  const totalPoints = allAccounts.reduce((s: number, a: any) => s + (a.currentPoints ?? 0), 0);
  const activeCount = allAccounts.filter((a: any) => (a.currentPoints ?? 0) > 0).length;
  const platCount   = allAccounts.filter((a: any) => tierFor(a.currentPoints ?? 0, settings) === 'PLATINUM').length;

  return (
    <div style={{ padding: '20px 0 8px' }}>
      <LargeHeader eyebrow="Growth" title="Loyalty" style={{ padding: '0 16px 16px' }} />

      {/* Hero card */}
      <div style={{ padding: '0 16px', marginBottom: 18 }}>
        <div style={{ position: 'relative', borderRadius: 22, background: 'var(--m-grad-hero)', padding: '22px 20px 20px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(222,146,119,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            Active members
          </div>
          {isLoading ? (
            <SkeletonRect width={100} height={36} radius={10} style={{ background: 'rgba(255,255,255,0.25)', marginBottom: 18 }} />
          ) : (
            <div style={{ color: '#fff', fontSize: 36, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 18 }}>
              {activeCount.toLocaleString()}
            </div>
          )}
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Total pts',  value: isLoading ? '—' : totalPoints.toLocaleString() },
              { label: 'Platinum',   value: isLoading ? '—' : platCount.toLocaleString() },
              { label: 'Pts/dollar', value: isLoading ? '—' : `${settings?.pointsPerDollar ?? 1}x` },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, paddingLeft: i > 0 ? 10 : 0, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.18)' : 'none', marginLeft: i > 0 ? 10 : 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 3 }}>{s.label}</div>
                <div style={{ color: '#fff', fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier filter chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 16, overflowX: 'auto' }}>
        {TIER_FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={tierFilter === f.key} onClick={() => setTierFilter(f.key)} />
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        <SectionHead title={`Members${tierFilter !== 'ALL' ? ` · ${TIER_CONFIG[tierFilter as Tier]?.label}` : ''}`} style={{ marginBottom: 10 }} />

        {isLoading ? (
          <Card style={{ padding: '0 16px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i < 4 ? '1px solid var(--m-line2)' : 'none' }}>
                <SkeletonRect width={40} height={40} radius={20} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <SkeletonRect width="50%" height={13} />
                  <SkeletonRect width="30%" height={10} />
                </div>
                <SkeletonRect width={56} height={22} radius={8} />
              </div>
            ))}
          </Card>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--m-surface)', borderRadius: 22, border: '1px solid var(--m-line2)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⭐</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 4 }}>No members yet</div>
            <div style={{ fontSize: 13, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>Clients earn points with each visit</div>
          </div>
        ) : (
          <Card style={{ padding: '0 16px' }}>
            {filtered.map((a: any, i: number) => (
              <MemberRow key={a.id} account={a} settings={settings} last={i === filtered.length - 1} />
            ))}
          </Card>
        )}

        {/* Settings info */}
        {settings && !isLoading && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--m-soft)', fontSize: 12.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', lineHeight: 1.5 }}>
            {settings.pointsPerDollar ?? 1} pts per $1 spent · ${settings.dollarPerPoint ?? 0.01} per point redeemed. Manage tiers on desktop.
          </div>
        )}
      </div>
    </div>
  );
}
