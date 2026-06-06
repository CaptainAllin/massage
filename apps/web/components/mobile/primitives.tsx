'use client';

import React from 'react';

// ─── Avatar ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#5D4AA8', '#7665C2', '#3E9E7A', '#DE9277', '#3A87D4',
  '#9B59B6', '#E67E22', '#27AE60', '#E74C3C', '#2980B9',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  color?: string;
  square?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function Avatar({ name, src, size = 44, color, square = false, style, className }: AvatarProps) {
  const bg = color ?? avatarColor(name);
  const fontSize = Math.round(size * 0.38);
  const borderRadius = square ? Math.round(size * 0.3) : '50%';
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius,
        background: src ? undefined : `${bg}22`,
        border: `1.5px solid ${bg}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize, fontWeight: 700, color: bg, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {initials(name)}
        </span>
      )}
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  padding?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, padding = 16, style, className, onClick }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--m-surface)',
        borderRadius: 22,
        border: '1px solid var(--m-line2)',
        boxShadow: '0 1px 2px rgba(30,24,48,0.04)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Chip ───────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  active?: boolean;
  dot?: string;
  count?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Chip({ label, active = false, dot, count, onClick, style }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="im-tab im-press"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '10px 13px',
        minHeight: 44,
        borderRadius: 100,
        border: active ? 'none' : '1px solid var(--m-line)',
        background: active ? 'var(--m-grad)' : 'var(--m-surface)',
        color: active ? '#fff' : 'var(--m-ink2)',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        flexShrink: 0,
        ...style,
      }}
    >
      {dot && !active && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      )}
      {label}
      {count !== undefined && (
        <span
          style={{
            background: active ? 'rgba(255,255,255,0.25)' : 'var(--m-soft)',
            color: active ? '#fff' : 'var(--m-primary)',
            borderRadius: 100,
            padding: '1px 6px',
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── StatusChip ─────────────────────────────────────────────────────────────

type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | string;

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  scheduled:   { label: 'Scheduled',   bg: 'var(--m-soft)',      color: 'var(--m-primary)' },
  confirmed:   { label: 'Confirmed',   bg: 'var(--m-ok-soft)',   color: 'var(--m-ok)' },
  in_progress: { label: 'In Progress', bg: 'var(--m-info-soft)', color: 'var(--m-info)' },
  completed:   { label: 'Completed',   bg: '#F0EEF4',            color: 'var(--m-muted)' },
  cancelled:   { label: 'Cancelled',   bg: 'var(--m-warn-soft)', color: 'var(--m-accent-dk)' },
};

interface StatusChipProps {
  status: AppointmentStatus;
  style?: React.CSSProperties;
}

export function StatusChip({ status, style }: StatusChipProps) {
  const cfg = STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG.scheduled;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 100,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11.5,
        fontWeight: 600,
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── SectionHead ────────────────────────────────────────────────────────────

interface SectionHeadProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

export function SectionHead({ title, action, onAction, style }: SectionHeadProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 19,
          fontWeight: 600,
          color: 'var(--m-ink)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          letterSpacing: -0.3,
        }}
      >
        {title}
      </span>
      {action && (
        <button
          onClick={(e) => { e.stopPropagation(); onAction?.(); }}
          className="im-tab"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--m-primary)',
            fontSize: 13.5,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '0 8px',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ─── Tag ────────────────────────────────────────────────────────────────────

interface TagProps {
  label: string;
  variant?: 'vip' | 'default';
  style?: React.CSSProperties;
}

export function Tag({ label, variant, style }: TagProps) {
  const isVip = variant === 'vip' || label.toLowerCase() === 'vip';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 100,
        background: isVip ? 'var(--m-accent-soft)' : 'var(--m-soft)',
        color: isVip ? 'var(--m-accent-dk)' : 'var(--m-primary)',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
