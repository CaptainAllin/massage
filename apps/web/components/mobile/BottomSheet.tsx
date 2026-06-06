'use client';

import React, { useEffect, useRef } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function BottomSheet({ open, onClose, title, children, style }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);
  const isDragging = useRef(false);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Non-passive touchmove listener so we can call preventDefault during drag
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !open) return;

    const handleMove = (e: TouchEvent) => {
      const scrollTop = contentRef.current?.scrollTop ?? 0;
      const deltaY = e.touches[0].clientY - dragStartY.current;
      if (deltaY > 0 && scrollTop <= 0) {
        isDragging.current = true;
        currentDragY.current = deltaY;
        sheet.style.transform = `translateY(${deltaY}px)`;
        sheet.style.transition = 'none';
        e.preventDefault();
      }
    };

    sheet.addEventListener('touchmove', handleMove, { passive: false });
    return () => sheet.removeEventListener('touchmove', handleMove);
  }, [open]);

  function handleTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = false;
    currentDragY.current = 0;
  }

  function handleTouchEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const sheet = sheetRef.current;

    if (currentDragY.current > 80) {
      if (sheet) {
        sheet.style.transform = 'translateY(100%)';
        sheet.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
      }
      setTimeout(onClose, 220);
    } else if (sheet) {
      sheet.style.transform = 'translateY(0)';
      sheet.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transform = '';
          sheetRef.current.style.transition = '';
        }
      }, 220);
    }
    currentDragY.current = 0;
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Dimmed overlay — click closes, does not scroll */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(28,20,48,0.42)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'var(--m-surface)',
          borderRadius: '28px 28px 0 0',
          maxHeight: '86%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'im-sheet-up 0.26s cubic-bezier(0.32, 0.72, 0, 1) forwards',
          ...style,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 100,
              background: 'var(--m-line)',
            }}
          />
        </div>

        {/* Title */}
        {title && (
          <div
            style={{
              padding: '4px 20px 12px',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              flexShrink: 0,
            }}
          >
            {title}
          </div>
        )}

        {/* Content — scrolls independently; overscrollBehavior prevents scroll chaining to backdrop */}
        <div
          ref={contentRef}
          style={{ overflowY: 'auto', flex: 1, overscrollBehavior: 'contain' }}
          className="im-scroll"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
