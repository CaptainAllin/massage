'use client';

import React, { useState, useMemo } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Avatar } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useConversations } from '@/lib/hooks/use-messages';
import type { MobileRouter } from '../MobileShell';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MessageChannel = 'sms' | 'email' | 'whatsapp';
type FilterType = 'all' | 'unread' | 'sms' | 'email' | 'whatsapp';

export interface MobileConversation {
  id: string;
  clientId: string;
  clientName: string;
  channel: MessageChannel;
  preview: string;
  timestamp: string;
  unreadCount: number;
  messages: MobileMessage[];
}

export interface MobileMessage {
  id: string;
  text: string;
  sent: boolean;
  timestamp: string;
  dateHeader?: string;
}

interface MobileMessagesProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Channel config ───────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<MessageChannel, { color: string; bg: string; border: string; label: string }> = {
  sms:      { color: '#5D4AA8', bg: 'rgba(93,74,168,0.10)',  border: 'rgba(93,74,168,0.22)',  label: 'SMS' },
  email:    { color: '#3A87D4', bg: 'rgba(58,135,212,0.10)', border: 'rgba(58,135,212,0.22)', label: 'Email' },
  whatsapp: { color: '#25D366', bg: 'rgba(37,211,102,0.10)', border: 'rgba(37,211,102,0.22)', label: 'WhatsApp' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function channelFromType(type: string): MessageChannel {
  const t = type.toLowerCase();
  if (t === 'email') return 'email';
  if (t === 'whatsapp') return 'whatsapp';
  return 'sms';
}

function fmtTimestamp(d: Date | null): string {
  if (!d) return '';
  const now = new Date();
  const date = new Date(d);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapConversation(c: any): MobileConversation {
  const clientName = c.client
    ? `${c.client.firstName ?? ''} ${c.client.lastName ?? ''}`.trim()
    : c.clientName ?? 'Unknown';
  return {
    id: c.id,
    clientId: c.clientId ?? '',
    clientName: clientName || 'Unknown',
    channel: channelFromType(c.type ?? 'sms'),
    preview: c.lastMessagePreview ?? '(no preview)',
    timestamp: fmtTimestamp(c.lastMessageAt),
    unreadCount: c.unreadCount ?? 0,
    messages: [],
  };
}

// ─── Channel Badge (avatar overlay) ──────────────────────────────────────────

function ChannelBadge({ channel }: { channel: MessageChannel }) {
  const { color, label } = CHANNEL_CONFIG[channel];
  return (
    <div
      style={{
        position: 'absolute', bottom: -2, right: -2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 5px rgba(0,0,0,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 16, height: 16, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 6.5, fontWeight: 800, color: '#fff',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            letterSpacing: -0.3, lineHeight: 1,
          }}
        >
          {label === 'WhatsApp' ? 'WA' : label}
        </span>
      </div>
    </div>
  );
}

// ─── Channel Pill ─────────────────────────────────────────────────────────────

function ChannelPill({ channel }: { channel: MessageChannel }) {
  const { color, bg, label } = CHANNEL_CONFIG[channel];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 7px', borderRadius: 100,
        background: bg,
        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        textTransform: 'uppercase', color,
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
      }}
    >
      {label}
    </span>
  );
}

// ─── Conversation Card ────────────────────────────────────────────────────────

function ConvRow({ convo, onClick, isLast }: { convo: MobileConversation; onClick: () => void; isLast: boolean }) {
  const isUnread = convo.unreadCount > 0;
  const { color } = CHANNEL_CONFIG[convo.channel];

  return (
    <button
      className="im-tab im-press"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: `10px 14px 10px ${isUnread ? '18px' : '14px'}`,
        background: isUnread ? 'rgba(93,74,168,0.03)' : 'var(--m-surface)',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--m-line2)',
        borderRadius: 0,
        boxShadow: 'none',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar for unread conversations */}
      {isUnread && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 4, background: color,
        }} />
      )}

      {/* Avatar + channel badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={convo.clientName} size={38} />
        <ChannelBadge channel={convo.channel} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <span
            style={{
              fontSize: 14.5, fontWeight: isUnread ? 700 : 500,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '65%',
            }}
          >
            {convo.clientName}
          </span>
          <span
            style={{
              fontSize: 11.5,
              color: isUnread ? color : 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              fontWeight: isUnread ? 600 : 400,
              flexShrink: 0, marginLeft: 8, whiteSpace: 'nowrap',
            }}
          >
            {convo.timestamp}
          </span>
        </div>

        {/* Preview + unread badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontSize: 12.5,
              color: isUnread ? 'var(--m-ink2)' : 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4, flex: 1, minWidth: 0,
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {convo.preview}
          </span>
          {isUnread && (
            <div
              style={{
                width: 20, height: 20, borderRadius: '50%',
                background: color, color: '#fff',
                fontSize: 10.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Filter Chips ─────────────────────────────────────────────────────────────

function FilterChips({
  filter,
  setFilter,
  unreadCount,
}: {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  unreadCount: number;
}) {
  const chips: Array<{ key: FilterType; label: string; color: string; badge?: number }> = [
    { key: 'all',      label: 'All',      color: '#5D4AA8' },
    { key: 'unread',   label: 'Unread',   color: '#5D4AA8', badge: unreadCount },
    { key: 'sms',      label: 'SMS',      color: CHANNEL_CONFIG.sms.color },
    { key: 'email',    label: 'Email',    color: CHANNEL_CONFIG.email.color },
    { key: 'whatsapp', label: 'WhatsApp', color: CHANNEL_CONFIG.whatsapp.color },
  ];

  return (
    <div
      style={{
        display: 'flex', gap: 7, overflowX: 'auto',
        padding: '0 16px 12px',
        scrollbarWidth: 'none',
      }}
    >
      {chips.map(({ key, label, color, badge }) => {
        const active = filter === key;
        return (
          <button
            key={key}
            className="im-tab"
            onClick={() => setFilter(key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 13px', borderRadius: 100,
              border: active ? 'none' : '1px solid var(--m-line2)',
              background: active ? color : 'var(--m-surface)',
              color: active ? '#fff' : 'var(--m-ink2)',
              fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            {label}
            {badge !== undefined && badge > 0 && (
              <span
                style={{
                  background: active ? 'rgba(255,255,255,0.3)' : color,
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  borderRadius: 100, padding: '1px 5px',
                  lineHeight: 1.4,
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Messages Screen ──────────────────────────────────────────────────────────

export function MobileMessages({ router }: MobileMessagesProps) {
  const businessId = useBusinessId();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: convResponse, isLoading } = useConversations(businessId, {
    search: search || undefined,
  });

  const conversations: MobileConversation[] = useMemo(() => {
    const raw = (convResponse as any)?.data ?? convResponse ?? [];
    if (!Array.isArray(raw)) return [];

    const mapped = raw.map(mapConversation);

    // Group by clientId — API returns newest-first, so first occurrence is most recent
    const seen = new Set<string>();
    const unreadByClient = new Map<string, number>();
    for (const c of mapped) {
      const key = c.clientId || c.id;
      unreadByClient.set(key, (unreadByClient.get(key) ?? 0) + c.unreadCount);
    }
    return mapped
      .filter((c) => {
        const key = c.clientId || c.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((c) => ({ ...c, unreadCount: unreadByClient.get(c.clientId || c.id) ?? c.unreadCount }));
  }, [convResponse]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const filtered = useMemo(() => {
    if (filter === 'all') return conversations;
    if (filter === 'unread') return conversations.filter((c) => c.unreadCount > 0);
    return conversations.filter((c) => c.channel === filter);
  }, [conversations, filter]);

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Header */}
      <LargeHeader
        eyebrow="Communications"
        title="Messages"
        subtitle={
          totalUnread > 0
            ? `${totalUnread} unread · SMS, Email & WhatsApp in one inbox.`
            : 'SMS, Email & WhatsApp — all in one inbox.'
        }
      />

      {/* Sticky search + filter chips */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 5,
          background: 'var(--m-bg)', padding: '0 16px 0',
        }}
      >
        {/* Search bar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--m-surface)',
            border: '1px solid var(--m-line)',
            borderRadius: 14, padding: '10px 14px',
            marginBottom: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" stroke="var(--m-muted)" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--m-ink)',
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

        {/* Filter chips */}
        <FilterChips filter={filter} setFilter={setFilter} unreadCount={totalUnread} />
      </div>

      {/* Conversation list */}
      <div style={{ padding: '0 16px 24px' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '48px 24px', gap: 8, color: 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            <span style={{ fontSize: 14 }}>Loading conversations…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '48px 24px', gap: 8, color: 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="var(--m-muted)" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            {search ? (
              <>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink2)' }}>No conversations found</span>
                <span style={{ fontSize: 12, textAlign: 'center' }}>Try a different search</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink2)' }}>
                  {filter === 'all' ? 'No messages yet' : `No ${filter} conversations`}
                </span>
                <span style={{ fontSize: 12, textAlign: 'center' }}>
                  {filter === 'all' ? 'Your client conversations will appear here' : 'Try a different filter'}
                </span>
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            border: '1px solid var(--m-line2)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(28,20,54,0.06)',
          }}>
            {filtered.map((convo, i) => (
              <ConvRow
                key={convo.id}
                convo={convo}
                isLast={i === filtered.length - 1}
                onClick={() => router.navigate('thread', convo)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
