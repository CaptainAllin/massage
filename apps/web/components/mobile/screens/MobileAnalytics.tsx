'use client';

import React, { useState } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Card, SectionHead, Chip } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useDashboardOverview } from '@/lib/hooks/useAnalytics';
import { useBusiness } from '@/lib/hooks/use-business';
import type { MobileRouter } from '../MobileShell';

interface MobileAnalyticsProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function trendColor(v: number): string {
  if (v > 0) return 'var(--m-ok)';
  if (v < 0) return 'var(--m-warn)';
  return 'var(--m-muted)';
}

function trendLabel(v: number): string {
  if (v > 0) return `↑ ${v.toFixed(1)}%`;
  if (v < 0) return `↓ ${Math.abs(v).toFixed(1)}%`;
  return 'No change';
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRect({ width = '100%', height = 16, radius = 8, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  return <div className="im-skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

// ─── KPI Tile ────────────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  value: string;
  trend?: number;
  sub?: string;
}

function KpiTile({ label, value, trend, sub }: KpiTileProps) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', letterSpacing: -0.5, lineHeight: 1.1 }}>
        {value}
      </div>
      {trend !== undefined && (
        <div style={{ fontSize: 11.5, fontWeight: 600, color: trendColor(trend), fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 3 }}>
          {trendLabel(trend)}
        </div>
      )}
      {sub && !trend && (
        <div style={{ fontSize: 11.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function KpiTileSkeleton() {
  return (
    <div style={{ flex: 1 }}>
      <SkeletonRect width="60%" height={10} radius={5} style={{ marginBottom: 8 }} />
      <SkeletonRect width="80%" height={22} radius={7} style={{ marginBottom: 6 }} />
      <SkeletonRect width="45%" height={10} radius={5} />
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function MetricSection({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionHead title={title} style={{ marginBottom: 10 }} />
      <Card style={{ padding: '18px 16px' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {loading ? (
            <>
              <KpiTileSkeleton />
              <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 14px', flexShrink: 0 }} />
              <KpiTileSkeleton />
            </>
          ) : children}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | '1yr';

const DATE_RANGE_OPTIONS: Array<{ key: DateRange; label: string; days: number }> = [
  { key: '7d',  label: '7d',   days: 7 },
  { key: '30d', label: '30d',  days: 30 },
  { key: '90d', label: '90d',  days: 90 },
  { key: '1yr', label: '1yr',  days: 365 },
];

export function MobileAnalytics({ router: _router }: MobileAnalyticsProps) {
  const businessId = useBusinessId();
  const [range, setRange] = useState<DateRange>('30d');

  const { data: business } = useBusiness(businessId);
  const currency = (business as any)?.currency || 'USD';

  const days = DATE_RANGE_OPTIONS.find((r) => r.key === range)!.days;
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const { data: overview, isLoading } = useDashboardOverview({ startDate, endDate });

  const rev = overview?.revenue;
  const clients = overview?.clients;
  const appts = overview?.appointments;
  const therapists = overview?.therapists;

  return (
    <div style={{ padding: '20px 0 8px' }}>
      <LargeHeader eyebrow="Growth" title="Analytics" style={{ padding: '0 16px 16px' }} />

      {/* Date range chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 20, overflowX: 'auto' }}>
        {DATE_RANGE_OPTIONS.map((opt) => (
          <Chip
            key={opt.key}
            label={opt.label}
            active={range === opt.key}
            onClick={() => setRange(opt.key)}
          />
        ))}
      </div>

      {/* Hero stat */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ position: 'relative', borderRadius: 22, background: 'var(--m-grad-hero)', padding: '22px 20px 20px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(222,146,119,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            Total revenue
          </div>
          {isLoading ? (
            <SkeletonRect width={160} height={36} radius={10} style={{ background: 'rgba(255,255,255,0.25)', marginBottom: 18 }} />
          ) : (
            <div style={{ color: '#fff', fontSize: 36, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 18 }}>
              {fmtCurrency(rev?.totalRevenue ?? 0, currency)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Avg transaction', value: isLoading ? '—' : fmtCurrency(rev?.averageTransactionValue ?? 0, currency) },
              { label: 'Transactions',    value: isLoading ? '—' : fmtNum(rev?.transactionCount ?? 0) },
              { label: 'Outstanding',     value: isLoading ? '—' : fmtCurrency(rev?.outstandingAmount ?? 0, currency) },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, paddingLeft: i > 0 ? 10 : 0, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.18)' : 'none', marginLeft: i > 0 ? 10 : 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 3 }}>{s.label}</div>
                <div style={{ color: '#fff', fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue growth badge */}
      {!isLoading && rev && (
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 16, background: 'var(--m-surface)', border: '1px solid var(--m-line2)' }}>
              <div style={{ fontSize: 11, color: 'var(--m-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 4 }}>Revenue growth</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: trendColor(rev.revenueGrowth), fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>{trendLabel(rev.revenueGrowth)}</div>
              <div style={{ fontSize: 11.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 2 }}>vs previous period</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px' }}>

        {/* Clients */}
        <MetricSection title="Clients" loading={isLoading}>
          <KpiTile label="Active clients" value={fmtNum(clients?.totalActiveClients ?? 0)} />
          <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 14px', flexShrink: 0 }} />
          <KpiTile label="New clients" value={fmtNum(clients?.newClients ?? 0)} trend={clients?.newClientsGrowth} />
        </MetricSection>

        {/* Retention */}
        <MetricSection title="Retention" loading={isLoading}>
          <KpiTile label="Return rate" value={fmtPct(clients?.returningClientRate ?? 0)} sub="Client retention" />
          <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 14px', flexShrink: 0 }} />
          <KpiTile label="Lifetime value" value={fmtCurrency(clients?.clientLifetimeValue ?? 0, currency)} sub="Avg per client" />
        </MetricSection>

        {/* Appointments */}
        <MetricSection title="Appointments" loading={isLoading}>
          <KpiTile label="Total" value={fmtNum(appts?.totalAppointments ?? 0)} trend={appts?.appointmentsGrowth} />
          <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 14px', flexShrink: 0 }} />
          <KpiTile label="Completion rate" value={fmtPct(appts?.completionRate ?? 0)} />
        </MetricSection>

        {/* Completion breakdown */}
        <MetricSection title="No-shows & cancellations" loading={isLoading}>
          <KpiTile label="Cancellations" value={fmtPct(appts?.cancellationRate ?? 0)} />
          <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 14px', flexShrink: 0 }} />
          <KpiTile label="No-show rate" value={fmtPct(appts?.noShowRate ?? 0)} />
        </MetricSection>

        {/* Therapists */}
        <MetricSection title="Therapists" loading={isLoading}>
          <KpiTile label="Active" value={fmtNum(therapists?.activeTherapists ?? 0)} />
          <div style={{ width: 1, background: 'var(--m-line2)', margin: '0 14px', flexShrink: 0 }} />
          <KpiTile label="Utilisation" value={fmtPct(therapists?.utilizationRate ?? 0)} sub="Overall efficiency" />
        </MetricSection>

        {therapists?.topPerformer && !isLoading && (
          <Card style={{ padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--m-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginBottom: 8 }}>
              Top performer
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                {therapists.topPerformer}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-primary)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
                {fmtCurrency(therapists.topPerformerRevenue ?? 0, currency)}
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 2 }}>
              Avg {fmtNum(therapists.averageSessionsPerTherapist ?? 0)} sessions / therapist
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
