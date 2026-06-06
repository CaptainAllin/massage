'use client';

import React, { useState, useMemo } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Avatar, Card } from '../primitives';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useConversations } from '@/lib/hooks/use-messages';
import type { MobileRouter } from '../MobileShell';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MessageChannel = 'sms' | 'email' | 'whatsapp';

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
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
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

// ─── Channel Icon ─────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: MessageChannel }) {
  const config = {
    sms:      { bg: '#5D4AA8', label: 'SMS' },
    email:    { bg: '#3A87D4', label: 'Email' },
    whatsapp: { bg: '#25D366', label: 'WA' },
  };
  const { bg, label } = config[channel];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: bg,
        border: '2px solid var(--m-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }}
    >
      <span
        style={{
          fontSize: 6.5,
          fontWeight: 800,
          color: '#fff',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          letterSpacing: -0.3,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Conversation Row ─────────────────────────────────────────────────────────

interface ConvRowProps {
  convo: MobileConversation;
  isLast: boolean;
  onClick: () => void;
}

function ConvRow({ convo, isLast, onClick }: ConvRowProps) {
  const isUnread = convo.unreadCount > 0;
  return (
    <button
      className="im-tab im-press"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 16px',
        background: isUnread ? 'var(--m-line3)' : 'none',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--m-line2)',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={convo.clientName} size={46} />
        <ChannelBadge channel={convo.channel} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 3,
          }}
        >
          <span
            style={{
              fontSize: 14.5,
              fontWeight: isUnread ? 700 : 500,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '60%',
            }}
          >
            {convo.clientName}
          </span>
          <span
            style={{
              fontSize: 11.5,
              color: isUnread ? 'var(--m-primary)' : 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              fontWeight: isUnread ? 600 : 400,
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {convo.timestamp}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontSize: 12.5,
              color: isUnread ? 'var(--m-ink2)' : 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
              flex: 1,
              minWidth: 0,
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {convo.preview}
          </span>

          {isUnread && (
            <span
              style={{
                background: 'var(--m-grad)',
                color: '#fff',
                fontSize: 10.5,
                fontWeight: 700,
                lineHeight: 1,
                padding: '3px 6px',
                borderRadius: 100,
                minWidth: 20,
                textAlign: 'center',
                flexShrink: 0,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {convo.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Messages Screen ──────────────────────────────────────────────────────────

export function MobileMessages({ router }: MobileMessagesProps) {
  const businessId = useBusinessId();
  const [search, setSearch] = useState('');

  const { data: convResponse, isLoading } = useConversations(businessId, {
    search: search || undefined,
  });

  const conversations: MobileConversation[] = useMemo(() => {
    const raw = (convResponse as any)?.data ?? convResponse ?? [];
    return Array.isArray(raw) ? raw.map(mapConversation) : [];
  }, [convResponse]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div style={{ paddingTop: 8 }}>
      {/* 8.1.1 Header */}
      <LargeHeader
        eyebrow="Communications"
        title="Messages"
        subtitle="SMS, Email & WhatsApp — all in one inbox."
      />

      {/* 8.1.2 Sticky search bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: 'var(--m-bg)',
          padding: '0 16px 12px',
        }}
      >
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
            placeholder="Search conversations…"
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

      {/* 8.1.3 Conversation list */}
      <div style={{ padding: '0 16px 16px' }}>
        {isLoading ? (
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
            <span style={{ fontSize: 14 }}>Loading conversations…</span>
          </div>
        ) : conversations.length === 0 ? (
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
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--m-ink2)' }}>No messages yet</span>
                <span style={{ fontSize: 12, textAlign: 'center' }}>Your client conversations will appear here</span>
              </>
            )}
          </div>
        ) : (
          <Card padding={0} style={{ overflow: 'hidden' }}>
            {conversations.map((convo, i) => (
              <ConvRow
                key={convo.id}
                convo={convo}
                isLast={i === conversations.length - 1}
                onClick={() => router.navigate('thread', convo)}
              />
            ))}
          </Card>
        )}

        {totalUnread > 0 && !search && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'var(--m-soft)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--m-primary)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: 'var(--m-primary)',
                fontWeight: 600,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
