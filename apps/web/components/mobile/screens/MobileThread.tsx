'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '../primitives';
import type { MobileRouter } from '../MobileShell';
import type { MobileConversation, MobileMessage, MessageChannel } from './MobileMessages';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useConversationMessages, useSendMessage, useMarkConversationRead } from '@/lib/hooks/use-messages';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MobileThreadProps {
  router: MobileRouter;
  param: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function channelLabel(channel: MessageChannel): string {
  return channel === 'sms' ? 'SMS' : channel === 'email' ? 'Email' : 'WhatsApp';
}

function channelColor(channel: MessageChannel): string {
  return channel === 'sms' ? '#5D4AA8' : channel === 'email' ? '#3A87D4' : '#25D366';
}

function fmtTime(d: Date | string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDateHeader(d: Date | string): string {
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function mapApiMessages(apiMessages: any[]): MobileMessage[] {
  // API returns newest-first; reverse to display oldest-first
  const sorted = [...apiMessages].reverse();
  return sorted.map((msg, i) => {
    const prevMsg = sorted[i - 1];
    const dateKey = new Date(msg.createdAt).toDateString();
    const prevDateKey = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
    return {
      id: msg.id,
      text: msg.content,
      sent: msg.direction === 'OUTBOUND',
      timestamp: fmtTime(msg.createdAt),
      dateHeader: dateKey !== prevDateKey ? fmtDateHeader(msg.createdAt) : undefined,
    };
  });
}

// ─── Thread Header ────────────────────────────────────────────────────────────

interface ThreadHeaderProps {
  convo: MobileConversation;
  onBack: () => void;
}

function ThreadHeader({ convo, onBack }: ThreadHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: 'var(--m-surface)',
        borderBottom: '1px solid var(--m-line2)',
        flexShrink: 0,
      }}
    >
      {/* Back button */}
      <button
        className="im-tab im-press"
        onClick={onBack}
        aria-label="Back to messages"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--m-primary)',
          padding: '12px 0',
          minHeight: 44,
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          fontSize: 14,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Avatar */}
      <Avatar name={convo.clientName} size={36} />

      {/* Name + channel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--m-ink)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {convo.clientName}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: channelColor(convo.channel),
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            fontWeight: 600,
            marginTop: 1,
          }}
        >
          {channelLabel(convo.channel)}
        </div>
      </div>

      {/* Call button */}
      <button
        className="im-tab im-press"
        aria-label="Call client"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--m-soft)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--m-primary)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.45 2 2 0 0 1 3.59 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

interface BubbleProps {
  message: MobileMessage & { pending?: boolean };
}

function Bubble({ message }: BubbleProps) {
  const isSent = message.sent;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSent ? 'flex-end' : 'flex-start',
        marginBottom: 8,
        opacity: message.pending ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <div
        style={{
          maxWidth: '76%',
          padding: '10px 14px',
          borderRadius: isSent
            ? '18px 18px 5px 18px'
            : '18px 18px 18px 5px',
          background: isSent ? 'var(--m-grad)' : 'var(--m-surface)',
          border: isSent ? 'none' : '1px solid var(--m-line)',
          color: isSent ? '#fff' : 'var(--m-ink)',
          fontSize: 14,
          lineHeight: 1.45,
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          wordBreak: 'break-word',
          boxShadow: isSent ? 'none' : '0 1px 3px rgba(28,20,54,0.06)',
        }}
      >
        {message.text}
      </div>
      <span
        style={{
          fontSize: 10.5,
          color: 'var(--m-muted)',
          marginTop: 3,
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          paddingLeft: isSent ? 0 : 2,
          paddingRight: isSent ? 2 : 0,
        }}
      >
        {message.pending ? 'Sending…' : message.timestamp}
      </span>
    </div>
  );
}

// ─── Thread Screen ────────────────────────────────────────────────────────────

export function MobileThread({ router }: MobileThreadProps) {
  const convo = router.param as MobileConversation | null;
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  const [optimisticMessages, setOptimisticMessages] = useState<(MobileMessage & { pending?: boolean })[]>([]);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstScroll = useRef(true);

  // 7.2.5 — load real message history
  const { data: msgResponse, isLoading } = useConversationMessages(
    convo?.id ?? '',
    businessId,
    1,
    50
  );

  const markRead = useMarkConversationRead(businessId);

  // Mark conversation as read when thread is opened
  useEffect(() => {
    if (convo?.id && businessId) {
      markRead.mutate(convo.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convo?.id, businessId]);

  // 7.3.3 — send message mutation
  const sendMessage = useSendMessage(businessId);

  const serverMessages = useMemo(() => {
    const raw = (msgResponse as any)?.data ?? msgResponse ?? [];
    return Array.isArray(raw) ? mapApiMessages(raw) : [];
  }, [msgResponse]);

  const allMessages = useMemo(
    () => [...serverMessages, ...optimisticMessages],
    [serverMessages, optimisticMessages]
  );

  // 7.2.6 — auto-scroll: instant on first load, smooth for new messages
  useEffect(() => {
    if (allMessages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: isFirstScroll.current ? 'instant' : 'smooth',
    } as ScrollIntoViewOptions);
    isFirstScroll.current = false;
  }, [allMessages]);

  if (!convo) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--m-muted)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          fontSize: 14,
        }}
      >
        Conversation not found
      </div>
    );
  }

  const firstName = convo.clientName.split(' ')[0];

  // 7.3.3 + 7.3.4 — send with optimistic UI
  function handleSend() {
    const text = draft.trim();
    if (!text || !convo || !businessId) return;

    const tempId = `opt-${Date.now()}`;
    const optimistic: MobileMessage & { pending: boolean } = {
      id: tempId,
      text,
      sent: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      pending: true,
    };

    // 7.3.4 — optimistic: message appears immediately
    setOptimisticMessages((prev) => [...prev, optimistic]);
    setDraft('');
    inputRef.current?.focus();

    sendMessage.mutate(
      {
        businessId,
        recipientId: convo.clientId,
        recipientType: 'CLIENT',
        type: convo.channel.toUpperCase(),
        content: text,
      },
      {
        onSuccess: (newMsg) => {
          // Add confirmed message to cache, then drop optimistic — no flash
          if (newMsg) {
            queryClient.setQueryData(
              ['conversation-messages', convo.id, 1, 50],
              (old: any) => {
                if (!old) return old;
                const arr: any[] = Array.isArray(old.data) ? old.data : (Array.isArray(old) ? old : []);
                const prepended = [newMsg, ...arr];
                return old?.data !== undefined ? { ...old, data: prepended } : prepended;
              }
            );
          }
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
        },
        onError: () => {
          // Remove failed optimistic message
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
        },
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--m-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <ThreadHeader convo={convo} onBack={router.goBack} />

      {/* Scrollable message area */}
      <div
        className="im-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              fontSize: 13,
            }}
          >
            Loading messages…
          </div>
        ) : allMessages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'var(--m-muted)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              fontSize: 13,
            }}
          >
            No messages yet. Say hello!
          </div>
        ) : (
          allMessages.map((msg) => (
            <React.Fragment key={msg.id}>
              {msg.dateHeader && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    margin: '8px 0 14px',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--m-line2)' }} />
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--m-muted)',
                      fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                      fontWeight: 600,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {msg.dateHeader}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--m-line2)' }} />
                </div>
              )}
              <Bubble message={msg} />
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: 'var(--m-surface)',
          borderTop: '1px solid var(--m-line2)',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={`Message ${firstName}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'var(--m-bg)',
            border: '1px solid var(--m-line)',
            borderRadius: 22,
            padding: '10px 16px',
            fontSize: 14,
            color: 'var(--m-ink)',
            outline: 'none',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            minHeight: 44,
          }}
        />
        <button
          className="im-tab im-press"
          onClick={handleSend}
          disabled={!draft.trim() || sendMessage.isPending}
          aria-label="Send message"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: draft.trim() && !sendMessage.isPending ? 'var(--m-grad)' : 'var(--m-line)',
            border: 'none',
            cursor: draft.trim() && !sendMessage.isPending ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
