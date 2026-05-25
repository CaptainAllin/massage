'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@massage/auth';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TourStep {
  title: string;
  description: string;
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Therapist hours & commission',
    description:
      'Create a payroll period by clicking "New Period" and setting the start and end dates. Payroll records are auto-generated for each therapist based on completed appointments in that window — including session counts, hours worked, and commission earned at their configured rate.',
    tip: 'Expand a payroll period to see individual therapist records. You can adjust individual amounts before finalising.',
  },
  {
    title: 'Export a payroll run',
    description:
      'Once you\'ve reviewed the records, change the period status to "Paid" and click the export button to download a CSV. The export includes therapist name, hours, gross pay, commission, and net pay — ready to import into your accounting or payroll software.',
    tip: 'Keep periods in "Draft" while reviewing. Only move to "Paid" once you\'ve processed the actual payments to therapists.',
  },
];

function storageKey(userId: string) {
  return `payroll_tour_dismissed_${userId}`;
}

export function PayrollTour() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anon';

  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey(userId)) === 'true';
    setDismissed(isDismissed);
    setLoaded(true);
  }, [userId]);

  const dismiss = useCallback(() => {
    localStorage.setItem(storageKey(userId), 'true');
    setDismissed(true);
  }, [userId]);

  if (!loaded || dismissed) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, #F9F8FF 0%, #F3EFFD 100%)',
        border: '1px solid rgba(93,74,168,0.18)',
        boxShadow: '0 2px 16px rgba(93,74,168,0.08)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
          >
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              <path d="M16 11l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4AA8', letterSpacing: '0.8px' }}>
              Payroll guide &middot; Step {step + 1} of {TOUR_STEPS.length}
            </p>
            <h3 className="text-sm font-semibold mt-0.5" style={{ color: '#1E1830' }}>
              {current.title}
            </h3>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ color: '#7A7090' }}
          title="Dismiss guide"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed mb-3" style={{ color: '#3D3450' }}>
        {current.description}
      </p>

      {/* Tip */}
      <div
        className="rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2"
        style={{ background: 'rgba(93,74,168,0.07)', border: '1px solid rgba(93,74,168,0.12)' }}
      >
        <svg className="flex-shrink-0 mt-0.5" width="14" height="14" fill="#5D4AA8" viewBox="0 0 24 24">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7zm2 17H10v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1z" />
        </svg>
        <p className="text-xs" style={{ color: '#5D4AA8' }}>
          {current.tip}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={isFirst}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-0"
          style={{ color: '#5D4AA8', border: '1px solid rgba(93,74,168,0.25)', background: '#fff' }}
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="flex items-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all"
              style={{
                width: i === step ? '20px' : '6px',
                height: '6px',
                background: i === step ? '#5D4AA8' : '#D1C4E0',
              }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={dismiss}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(93,74,168,0.28)',
            }}
          >
            Done
          </button>
        ) : (
          <button
            onClick={() => setStep(s => Math.min(TOUR_STEPS.length - 1, s + 1))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: '#5D4AA8', border: '1px solid rgba(93,74,168,0.25)', background: '#fff' }}
          >
            Next
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
