'use client';

import Link from 'next/link';

interface OnboardingProgressBarProps {
  completedCount: number;
  totalCount: number;
  progressPct: number;
  onDismiss: () => void;
}

export function OnboardingProgressBar({
  completedCount,
  totalCount,
  progressPct,
  onDismiss,
}: OnboardingProgressBarProps) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-5 py-3 mb-5"
      style={{ background: '#EDE5F4', border: '1px solid rgba(93,74,168,0.15)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#3D3450' }}>
            Setup progress &mdash; {completedCount} of {totalCount} steps done
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color: '#5D4AA8' }}>
            {progressPct}%
          </span>
        </div>
        <div
          className="w-full overflow-hidden rounded-full"
          style={{ height: '6px', background: 'rgba(93,74,168,0.15)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #7665C2, #5D4AA8)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      <Link
        href="/dashboard"
        className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap"
        style={{ color: '#5D4AA8', background: 'rgba(93,74,168,0.1)' }}
      >
        View checklist
      </Link>

      <button
        onClick={onDismiss}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ color: '#7A7090' }}
        title="Dismiss progress bar"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
