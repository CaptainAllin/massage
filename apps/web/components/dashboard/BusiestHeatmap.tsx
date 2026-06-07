'use client';

import React from 'react';
import type { HeatmapCell } from '@/lib/types/dashboard';

const SLOTS = ['morning', 'midday', 'afternoon', 'evening'] as const;
type Slot = typeof SLOTS[number];

const SLOT_LABELS: Record<Slot, string> = {
  morning: 'Morn',
  midday: 'Midday',
  afternoon: 'Aftn',
  evening: 'Eve',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface BusiestHeatmapProps {
  cells: HeatmapCell[];
  todayDayIndex: number;
}

export function BusiestHeatmap({ cells, todayDayIndex }: BusiestHeatmapProps) {
  const allZero = cells.every((c) => c.density === 0);

  function density(slot: Slot, day: number): number {
    return cells.find((c) => c.slot === slot && c.day === day)?.density ?? 0;
  }

  function cellBg(d: number): string {
    if (d === 0) return '#F4F3F8';
    return `rgba(93, 74, 168, ${Math.min(1, d).toFixed(2)})`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Column headers */}
      <div style={{ display: 'flex', marginLeft: 60 }}>
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: i === todayDayIndex ? 700 : 500,
              color: i === todayDayIndex ? '#5D4AA8' : '#7E748F',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {SLOTS.map((slot) => (
        <div key={slot} style={{ display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              width: 60,
              fontSize: 11,
              color: '#7E748F',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {SLOT_LABELS[slot]}
          </span>
          {Array.from({ length: 7 }, (_, i) => {
            const d = density(slot, i);
            const isToday = i === todayDayIndex;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 24,
                  background: cellBg(d),
                  margin: '1px',
                  borderRadius: 4,
                  outline: isToday ? '1.5px solid #5D4AA8' : undefined,
                  outlineOffset: -1,
                }}
              />
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
        <span
          style={{
            fontSize: 11,
            color: '#7E748F',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          Quiet
        </span>
        {[0.1, 0.3, 0.55, 0.8, 1].map((d) => (
          <div
            key={d}
            style={{ width: 14, height: 10, borderRadius: 2, background: cellBg(d) }}
          />
        ))}
        <span
          style={{
            fontSize: 11,
            color: '#7E748F',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          Busy
        </span>
      </div>

      {allZero && (
        <p
          style={{
            fontSize: 12,
            color: '#A79FB5',
            margin: '2px 0 0',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          Patterns appear after a few weeks of appointments
        </p>
      )}
    </div>
  );
}
