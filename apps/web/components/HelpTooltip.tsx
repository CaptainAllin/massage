'use client';

import { useState, useRef, useEffect } from 'react';

interface HelpTooltipProps {
  text: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ text, side = 'top' }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const positionClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={ref}
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold flex-shrink-0 focus:outline-none"
        style={{
          background: 'rgba(93,74,168,0.12)',
          color: '#5D4AA8',
          fontSize: '10px',
          lineHeight: 1,
        }}
        aria-label="Help"
      >
        ?
      </button>
      {open && (
        <span
          className={`absolute z-50 w-52 rounded-xl px-3 py-2 text-xs shadow-lg pointer-events-none ${positionClass}`}
          style={{
            background: '#1E1830',
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.5,
            whiteSpace: 'normal',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
