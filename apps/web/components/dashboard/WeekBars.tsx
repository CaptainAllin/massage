'use client';

import React from 'react';
import type { WeekBar } from '@/lib/types/dashboard';

const GRAD = 'linear-gradient(135deg,#5D4AA8,#3F2F87)';
const TODAY_COLOR = '#7C6AC9';
const DEFAULT_COLOR = '#B4A6E0';

interface WeekBarsProps {
  bars: WeekBar[];
  height?: number;
}

export function WeekBars({ bars, height = 80 }: WeekBarsProps) {
  const maxCount = Math.max(...bars.map((b) => b.count), 1);
  const allZero = bars.every((b) => b.count === 0);
  const busiestIdx = bars.reduce(
    (best, b, i) => (b.count > (bars[best]?.count ?? -1) ? i : best),
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
        {bars.map((bar, i) => {
          const isBusiest = !allZero && i === busiestIdx;
          const bg = isBusiest ? GRAD : bar.isToday ? TODAY_COLOR : DEFAULT_COLOR;
          const barH = allZero ? 2 : Math.max(2, (bar.count / maxCount) * (height - 20));
          return (
            <div
              key={bar.day}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 2,
              }}
            >
              {bar.count > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#1E1830',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    lineHeight: 1,
                  }}
                >
                  {bar.count}
                </span>
              )}
              <div
                style={{
                  width: '100%',
                  height: barH,
                  background: bg,
                  borderRadius: '4px 4px 2px 2px',
                  transition: 'height 0.3s ease',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {bars.map((bar) => (
          <span
            key={bar.day}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              color: bar.isToday ? '#5D4AA8' : '#7E748F',
              fontWeight: bar.isToday ? 700 : 500,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            {bar.day}
          </span>
        ))}
      </div>
      {allZero && (
        <p
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#A79FB5',
            margin: 0,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          No appointments this week
        </p>
      )}
    </div>
  );
}
