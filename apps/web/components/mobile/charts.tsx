'use client';

import React, { useId } from 'react';

// ─── Spark ──────────────────────────────────────────────────────────────────

interface SparkProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  up?: boolean;
}

export function Spark({ data, width = 64, height = 24, color, strokeWidth = 1.5, up }: SparkProps) {
  const resolvedColor =
    up !== undefined
      ? up
        ? 'var(--m-ok)'
        : 'var(--m-accent-dk)'
      : (color ?? 'var(--m-primary)');
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * w;
      const y = pad + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={resolvedColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── AreaChart ───────────────────────────────────────────────────────────────

interface AreaChartProps {
  data: number[];
  height?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function AreaChart({ data, height = 80, color = '#5D4AA8', strokeWidth = 2, style }: AreaChartProps) {
  const id = useId().replace(/:/g, '');
  if (!data || data.length < 2) return <div style={{ height, ...style }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const vb = { w: 300, h: height };
  const pad = { x: 0, y: strokeWidth + 4 };
  const innerH = vb.h - pad.y * 2;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * vb.w,
    y: pad.y + innerH - ((v - min) / range) * innerH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${vb.h} L 0 ${vb.h} Z`;
  const last = pts[pts.length - 1];

  return (
    <div style={{ width: '100%', ...style }}>
      <svg
        viewBox={`0 0 ${vb.w} ${vb.h}`}
        preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height }}
        overflow="visible"
      >
        <defs>
          <linearGradient id={`ag-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#ag-${id})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r={4} fill={color} />
        <circle cx={last.x} cy={last.y} r={7} fill={color} fillOpacity="0.18" />
      </svg>
    </div>
  );
}

// ─── Donut ───────────────────────────────────────────────────────────────────

interface DonutSegment {
  value: number;
  color: string;
  label?: string;
}

interface DonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Donut({ segments, size = 132, thickness = 20, centerLabel, style }: DonutProps) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * circ;
    const gap = circ - dash;
    const arc = { dash, gap, offset, ...seg };
    offset += dash + 3;
    return arc;
  });

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--m-line2)" strokeWidth={thickness} />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeDasharray={`${arc.dash - 3} ${arc.gap + 3}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
      </svg>
      {centerLabel && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centerLabel}
        </div>
      )}
    </div>
  );
}

// ─── Bars ────────────────────────────────────────────────────────────────────

interface BarsProps {
  data: { label: string; value: number; today?: boolean }[];
  height?: number;
  accentColor?: string;
  baseColor?: string;
  style?: React.CSSProperties;
}

export function Bars({ data, height = 80, accentColor = 'var(--m-primary)', baseColor = 'var(--m-soft)', style }: BarsProps) {
  if (!data || data.length === 0) return <div style={{ height, ...style }} />;
  const max = Math.max(...data.map((d) => d.value)) || 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        height: height + 32,
        paddingTop: 18,
        ...style,
      }}
    >
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * height);
        const isAccent = d.today ?? false;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              position: 'relative',
            }}
          >
            {/* value label above bar */}
            <span
              style={{
                position: 'absolute',
                top: -(barH + 18),
                fontSize: 10,
                fontWeight: 600,
                color: isAccent ? accentColor : 'var(--m-muted)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {d.value > 0 ? d.value : ''}
            </span>
            <div
              style={{
                width: '100%',
                height: barH,
                borderRadius: 5,
                background: isAccent ? 'var(--m-grad)' : baseColor,
                flexShrink: 0,
                alignSelf: 'flex-end',
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: isAccent ? 700 : 500,
                color: isAccent ? accentColor : 'var(--m-muted)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
