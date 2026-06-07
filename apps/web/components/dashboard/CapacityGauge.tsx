'use client';

import React from 'react';

const START = 135;
const SWEEP = 270;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const s = polar(cx, cy, r, from);
  const e = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`;
}

interface CapacityGaugeProps {
  booked: number;
  capacity: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  light?: string;
}

export function CapacityGauge({
  booked,
  capacity,
  size = 96,
  stroke = 10,
  color,
  track = '#F1EEF6',
  light,
}: CapacityGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const pct = capacity > 0 ? Math.min(1, Math.max(0, booked / capacity)) : 0;
  const fillEnd = START + pct * SWEEP;
  const open = Math.max(0, capacity - booked);
  const pctLabel = capacity > 0 ? Math.round(pct * 100) : 0;
  const gradId = `cg-grad-${size}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color ?? '#5D4AA8'} />
              <stop offset="100%" stopColor={light ?? '#3F2F87'} />
            </linearGradient>
          </defs>
          <path
            d={arc(cx, cy, r, START, START + SWEEP)}
            fill="none"
            stroke={capacity === 0 ? '#D9D4E8' : track}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {capacity > 0 && pct > 0 && (
            <path
              d={arc(cx, cy, r, START, fillEnd)}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: size * 0.08,
          }}
        >
          <span
            style={{
              fontSize: size * 0.26,
              fontWeight: 700,
              color: '#1E1830',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {booked}
          </span>
          <span
            style={{
              fontSize: size * 0.14,
              color: '#7E748F',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              lineHeight: 1.2,
            }}
          >
            /{capacity}
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: 13,
          color: '#7E748F',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          textAlign: 'center',
        }}
      >
        {capacity === 0 ? 'Set capacity in settings' : `${open} open · ${pctLabel}% booked`}
      </span>
    </div>
  );
}
