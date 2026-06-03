'use client';

import { useState } from 'react';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { useQuickCall } from '@/components/quick-call/QuickCallContext';

const WHATS_NEW_ITEMS = [
  { tag: 'New', title: 'AI treatment note summaries', desc: 'Generate SOAP note summaries in one click.' },
  { tag: 'New', title: 'Push notifications', desc: 'Browser alerts for new bookings and upcoming sessions.' },
  { tag: 'Improved', title: 'Therapist color-coding', desc: 'Calendar color-codes each therapist for fast scanning.' },
  { tag: 'New', title: 'Data exports', desc: 'Export clients, appointments, and payments to CSV.' },
];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  New:      { bg: '#E8F5E9', color: '#2D8A67' },
  Improved: { bg: '#EDE5F4', color: '#5D4AA8' },
  Fix:      { bg: '#FFF3E0', color: '#C97E68' },
};

function PhoneCallIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
      />
    </svg>
  );
}

function SetupRing({ progress, onClick }: { progress: number; onClick: () => void }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <button
      onClick={onClick}
      title={`Setup ${progress}% complete`}
      className="inline-flex items-center gap-2 text-sm font-medium transition-all"
      style={{
        height: 32,
        padding: '0 12px 0 8px',
        borderRadius: '999px',
        border: '1px solid #E5DEEC',
        background: '#FFFFFF',
        color: '#3D3450',
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
        <circle cx="9" cy="9" r={r} fill="none" stroke="#E5DEEC" strokeWidth="2.5" />
        <circle
          cx="9" cy="9" r={r} fill="none"
          stroke="#5D4AA8" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={`${(c * progress) / 100} ${c}`}
          transform="rotate(-90 9 9)"
        />
      </svg>
      <span style={{ fontSize: '11.5px' }}>Setup</span>
    </button>
  );
}

function WhatsNewButton({ unread, onRead }: { unread: boolean; onRead: () => void }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    if (!open && unread) onRead();
    setOpen((p) => !p);
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        title="What's New"
        className="relative flex items-center justify-center transition-all"
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '1px solid #E5DEEC',
          background: open ? '#EDE5F4' : '#FFFFFF',
          color: '#3D3450',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
        {unread && (
          <span
            className="absolute"
            style={{
              top: 7, right: 7,
              width: 7, height: 7,
              borderRadius: '50%',
              background: '#C97E68',
              border: '2px solid #FFFFFF',
            }}
          />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-50 rounded-2xl shadow-lg"
            style={{
              top: 42,
              width: 300,
              background: '#FFFFFF',
              border: '1px solid #EFE9F2',
              boxShadow: '0 8px 28px rgba(28,20,54,0.12), 0 2px 6px rgba(28,20,54,0.06)',
            }}
          >
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #F0EDF5' }}>
              <p className="font-semibold" style={{ fontSize: '14px', color: '#1E1830' }}>What&apos;s New</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Recent updates to Iris</p>
            </div>
            <div className="px-5 py-3 space-y-3">
              {WHATS_NEW_ITEMS.map((item, i) => {
                const ts = TAG_COLORS[item.tag] ?? TAG_COLORS.New;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 pb-3"
                    style={{ borderBottom: i < WHATS_NEW_ITEMS.length - 1 ? '1px solid #F0EDF5' : 'none' }}
                  >
                    <span
                      className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                      style={{ background: ts.bg, color: ts.color }}
                    >
                      {item.tag}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1E1830' }}>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickCallButton() {
  const { openQuickCall } = useQuickCall();
  return (
    <button
      onClick={() => openQuickCall()}
      title="Quick Call Intake"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
      style={{ border: '1px solid #E5DEEC', background: '#FFFFFF', color: '#3D3450' }}
    >
      <PhoneCallIcon />
      <span className="hidden sm:inline">Quick Call</span>
    </button>
  );
}

export function DashboardHeaderActions() {
  const { loaded, progressPct, allDone, whatsNewDismissed, dismissWhatsNew, reopenChecklist } = useOnboardingContext();
  if (!loaded) return null;
  return (
    <>
      <QuickCallButton />
      {!allDone && (
        <SetupRing progress={progressPct} onClick={reopenChecklist} />
      )}
      <WhatsNewButton unread={!whatsNewDismissed} onRead={dismissWhatsNew} />
    </>
  );
}
