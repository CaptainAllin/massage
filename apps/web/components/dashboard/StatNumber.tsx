'use client';

import React from 'react';

interface StatNumberProps {
  label: string;
  value: string | number | null | undefined;
  sub?: string;
  accent?: string;
}

export function StatNumber({ label, value, sub, accent }: StatNumberProps) {
  const display = value === null || value === undefined ? '—' : value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#7E748F',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#1E1830',
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          lineHeight: 1.1,
        }}
      >
        {display}
      </span>
      {sub && (
        <span
          style={{
            fontSize: 12,
            color: accent ?? '#7E748F',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            lineHeight: 1.3,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
