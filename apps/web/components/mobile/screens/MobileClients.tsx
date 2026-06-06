'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Avatar, Card, Chip, Tag } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useClientsWithMeta, type ClientFilterType } from '@/lib/hooks/use-clients';
import type { Client } from '@massage/types';
import type { MobileRouter } from '../MobileShell';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MobileClient {
  id: string;
  name: string;
  therapist: string;
  therapistColor: string;
  tags: string[];
  lastVisit: string;
  visitCount: number;
  vip?: boolean;
  due?: boolean;
  createdAt: string;
}

interface MobileClientsProps {
  router: MobileRouter;
  param: unknown;
}

type FilterKey = 'all' | 'vip' | 'new' | 'due' | 'inactive';

const PAGE_SIZE = 20;

const EMPTY_MESSAGES: Record<FilterKey, { title: string; sub: string }> = {
  all:      { title: 'No clients yet',              sub: 'Add your first client to get started' },
  vip:      { title: 'No VIP clients yet',          sub: 'Clients with 10+ visits appear here' },
  new:      { title: 'No new clients this month',   sub: 'New sign-ups will appear here' },
  due:      { title: 'No clients due for a visit',  sub: 'Clients overdue for a follow-up appear here' },
  inactive: { title: 'No inactive clients',         sub: 'Clients with no visits in 60+ days appear here' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const THERAPIST_COLORS = ['#5D4AA8', '#3E9E7A', '#3A87D4', '#DE9277', '#7665C2'];

function hashColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return THERAPIST_COLORS[Math.abs(h) % THERAPIST_COLORS.length];
}

function fmtDate(d: Date | null): string {
  if (!d) return 'No visits';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
}

function mapClient(c: Client): MobileClient {
  const extended = c as any;
  const tags: string[] = [];
  if (extended.isVip || extended.vip) tags.push('VIP');
  if (c.allergies?.length) tags.push('Allergies');
  if (c.totalVisits <= 3 && c.totalVisits > 0) tags.push('New');

  const preferredTherapistId = c.preferredTherapistId ?? c.id;
  const therapistName = extended.preferredTherapist
    ? `${extended.preferredTherapist.user?.firstName ?? ''} ${(extended.preferredTherapist.user?.lastName ?? '').charAt(0)}.`.trim()
    : '';

  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    therapist: therapistName || '—',
    therapistColor: hashColor(preferredTherapistId),
    tags,
    lastVisit: fmtDate(c.lastVisitDate),
    visitCount: c.totalVisits,
    vip: !!(extended.isVip || extended.vip),
    createdAt: new Date(c.createdAt).toISOString(),
  };
}

// ─── Client Row ───────────────────────────────────────────────────────────────

interface ClientRowProps {
  client: MobileClient;
  isLast: boolean;
  onClick: () => void;
}

function ClientRow({ client, isLast, onClick }: ClientRowProps) {
  return (
    <button
      className="im-tab im-press"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 16px',
        background: 'none',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--m-line2)',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <Avatar name={client.name} size={44} color={client.therapistColor} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '60%',
            }}
          >
            {client.name}
          </span>
          {client.tags.slice(0, 2).map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--m-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          {client.therapist !== '—' && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: client.therapistColor,
                flexShrink: 0,
              }}
            />
          )}
          {client.therapist !== '—' ? `${client.therapist} · ` : ''}Last visit {client.lastVisit}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
          gap: 1,
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--m-ink)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {client.visitCount}
        </span>
        <span
          style={{
            fontSize: 10.5,
            color: 'var(--m-muted)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            fontWeight: 600,
          }}
        >
          visits
        </span>
      </div>
    </button>
  );
}

// ─── Clients Screen ───────────────────────────────────────────────────────────

const FILTER_DEFS: { key: FilterKey; label: string; apiKey: ClientFilterType }[] = [
  { key: 'all',      label: 'All',            apiKey: 'all' },
  { key: 'vip',      label: 'VIP',            apiKey: 'vip' },
  { key: 'new',      label: 'New this month', apiKey: 'new' },
  { key: 'due',      label: 'Due for visit',  apiKey: 'due' },
  { key: 'inactive', label: 'Inactive 60d+',  apiKey: 'inactive' },
];

export function MobileClients({ router }: MobileClientsProps) {
  const businessId = useBusinessId();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<MobileClient[]>([]);
  const isFirstFetch = useRef(true);

  const currentApiFilter = FILTER_DEFS.find((f) => f.key === activeFilter)?.apiKey ?? 'all';

  // Reset to page 1 whenever search or filter changes
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
    isFirstFetch.current = true;
  }, [search, activeFilter]);

  const { data, isLoading, isFetching } = useClientsWithMeta(businessId, {
    search: search || undefined,
    filter: currentApiFilter,
    limit: PAGE_SIZE,
    page,
  });

  // Accumulate pages as user taps "Load more"
  useEffect(() => {
    if (!data?.data) return;
    const incoming = data.data.map(mapClient);
    if (isFirstFetch.current || page === 1) {
      setAccumulated(incoming);
      isFirstFetch.current = false;
    } else {
      setAccumulated((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        return [...prev, ...incoming.filter((c) => !existingIds.has(c.id))];
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const counts = data?.counts;
  const totalActive = counts?.all ?? data?.meta?.total ?? 0;
  const newThisMonth = counts?.newThisMonth ?? 0;
  const dueForFollowUp = counts?.dueForVisit ?? 0;
  const hasMore = data?.meta ? page < data.meta.totalPages : false;
  const isLoadingMore = isFetching && page > 1;

  function countFor(key: FilterKey): number {
    if (!counts) return 0;
    switch (key) {
      case 'all':      return counts.all;
      case 'vip':      return counts.vip;
      case 'new':      return counts.newThisMonth;
      case 'due':      return counts.dueForVisit;
      case 'inactive': return counts.inactive60d;
    }
  }

  const emptyMsg = EMPTY_MESSAGES[activeFilter];

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Header */}
      <LargeHeader
        eyebrow={`Clients · ${totalActive} active`}
        title="Your people"
        subtitle={`${newThisMonth} new this month · ${dueForFollowUp} due for follow-up`}
      />

      {/* Sticky Search + Filter Row */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: 'var(--m-bg)',
          paddingBottom: 12,
        }}
      >
        <div style={{ padding: '12px 16px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--m-surface)',
              border: '1px solid var(--m-line)',
              borderRadius: 14,
              padding: '10px 14px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" stroke="var(--m-muted)" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: 'var(--m-ink)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="im-tab"
                aria-label="Clear search"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6 6 18M6 6l12 12" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div
          className="im-scroll"
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 16px 0',
            overflowX: 'auto',
          }}
        >
          {FILTER_DEFS.map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              active={activeFilter === key}
              count={countFor(key)}
              onClick={() => setActiveFilter(key)}
            />
          ))}
        </div>
      </div>

      {/* Client List */}
      <div style={{ padding: '4px 16px 24px' }}>
        {isLoading && accumulated.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '48px 24px',
              gap: 8,
              color: 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            <span style={{ fontSize: 14 }}>Loading clients…</span>
          </div>
        ) : accumulated.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '48px 24px',
              gap: 8,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="var(--m-muted)" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="9" cy="7" r="4" stroke="var(--m-muted)" strokeWidth="1.6" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="var(--m-muted)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink2)' }}>{emptyMsg.title}</span>
            <span style={{ fontSize: 12, color: 'var(--m-muted)', textAlign: 'center' }}>{emptyMsg.sub}</span>
          </div>
        ) : (
          <>
            <Card padding={0} style={{ overflow: 'hidden' }}>
              {accumulated.map((client, i) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  isLast={i === accumulated.length - 1}
                  onClick={() => router.navigate('client-profile', client)}
                />
              ))}
            </Card>

            {hasMore && (
              <button
                className="im-press"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoadingMore}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  width: '100%',
                  marginTop: 12,
                  padding: '13px 0',
                  background: 'var(--m-surface)',
                  border: '1px solid var(--m-line2)',
                  borderRadius: 14,
                  cursor: isLoadingMore ? 'default' : 'pointer',
                  color: 'var(--m-primary)',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  opacity: isLoadingMore ? 0.6 : 1,
                }}
              >
                {isLoadingMore ? 'Loading…' : `Load more · ${(data?.meta?.total ?? 0) - accumulated.length} remaining`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
