'use client';

import React from 'react';

interface LargeHeaderProps {
  eyebrow?: string;
  title: string;
  /** Text to highlight with the violet→peach gradient within the title */
  accentText?: string;
  subtitle?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function LargeHeader({ eyebrow, title, accentText, subtitle, style, className }: LargeHeaderProps) {
  // Split title around accentText if provided
  let titleNode: React.ReactNode = title;
  if (accentText && title.includes(accentText)) {
    const [before, after] = title.split(accentText);
    titleNode = (
      <>
        {before}
        <span
          style={{
            background: 'linear-gradient(90deg, var(--m-primary) 0%, var(--m-accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {accentText}
        </span>
        {after}
      </>
    );
  }

  return (
    <div
      className={className}
      style={{
        padding: '20px 20px 4px',
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        ...style,
      }}
    >
      {eyebrow && (
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1.6,
            color: 'var(--m-primary)',
            margin: '0 0 6px',
          }}
        >
          {eyebrow}
        </p>
      )}

      <h1
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: -0.9,
          color: 'var(--m-ink)',
          margin: '0 0 6px',
          lineHeight: 1.15,
        }}
      >
        {titleNode}
      </h1>

      {subtitle && (
        <p
          style={{
            fontSize: 14,
            color: 'var(--m-muted)',
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
