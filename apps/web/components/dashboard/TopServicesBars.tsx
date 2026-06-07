'use client';

import React from 'react';
import type { ServiceShare } from '@/lib/types/dashboard';

const DEFAULT_PALETTE = ['#5D4AA8', '#7C6AC9', '#6E83C9', '#DE9277', '#B4A6E0'];

interface TopServicesBarsProps {
  services: ServiceShare[];
  palette?: string[];
}

export function TopServicesBars({ services, palette = DEFAULT_PALETTE }: TopServicesBarsProps) {
  if (services.length === 0) {
    return (
      <p
        style={{
          fontSize: 13,
          color: '#A79FB5',
          margin: 0,
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        }}
      >
        No services recorded this month
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {services.map((svc, i) => {
        const color = palette[i % palette.length];
        const barPct = Math.max(0, Math.min(100, svc.pct));
        return (
          <div key={svc.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 130,
                fontSize: 13,
                color: '#1E1830',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {svc.name}
            </span>
            <div
              style={{
                flex: 1,
                background: '#F1EEF6',
                borderRadius: 4,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${barPct}%`,
                  minWidth: barPct > 0 ? 4 : 0,
                  height: '100%',
                  background: color,
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span
              style={{
                width: 36,
                textAlign: 'right',
                fontSize: 13,
                color: '#7E748F',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                flexShrink: 0,
              }}
            >
              {Math.round(barPct)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
