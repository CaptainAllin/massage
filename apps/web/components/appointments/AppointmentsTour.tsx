'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@massage/auth';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface TourStep {
  title: string;
  description: string;
  tip: string;
  cta?: { label: string; href: string };
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Day, Week & Month views',
    description:
      'Switch between Day, Week, and Month views using the toggle in the top-left of the calendar. Week view gives you an at-a-glance overview; Day view shows granular hourly slots.',
    tip: 'Use the "Today" button to jump back to the current date from anywhere.',
  },
  {
    title: 'Therapist color-coding',
    description:
      'Each therapist is assigned a unique color that flows through to every appointment block. Click a therapist chip in the filter bar to show only their schedule.',
    tip: 'Filtering by therapist reduces visual noise on busy multi-staff days.',
  },
  {
    title: '"Now" indicator & status badges',
    description:
      'A live line in Week and Day views marks the current time so you always know what's happening right now. Every appointment shows a status badge: Scheduled, Confirmed, In Progress, Completed, or Cancelled.',
    tip: 'Use the status filter to focus on appointments that need action.',
  },
  {
    title: 'Book your first appointment',
    description:
      'Click any empty time slot on the calendar to open the New Appointment form. Choose a client, therapist, service type, and duration, then hit Schedule — the appointment lands on the calendar instantly.',
    tip: 'Toggle "Send reminder on booking" to automatically notify the client right away.',
  },
  {
    title: 'Manage & reschedule',
    description:
      'Click any appointment to open the detail panel where you can confirm, start, complete, or cancel a session. In Week view, drag and drop an appointment to a new slot to reschedule it.',
    tip: 'Check the dashboard for the "Open slots" card — it highlights fill-in opportunities for today.',
  },
  {
    title: 'Your client booking page',
    description:
      'Clients can self-book 24/7 at your public booking URL — no staff login required. Your logo, colors, and branding flow through automatically. Copy the link below and share it with clients or add it to your website.',
    tip: 'You can customise the branding in Settings → Branding.',
  },
];

function storageKey(userId: string) {
  return `appointments_tour_dismissed_${userId}`;
}

interface AppointmentsTourProps {
  businessId?: string;
}

export function AppointmentsTour({ businessId }: AppointmentsTourProps) {
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
  const bookingHref = businessId ? `/book/${businessId}` : '/settings';

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
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: '#5D4AA8', letterSpacing: '1.2px' }}>
              Calendar Tour
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
              Step {step + 1} of {TOUR_STEPS.length}
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
          style={{ color: '#9E96B0' }}
          aria-label="Dismiss tour"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full rounded-full mb-4" style={{ height: '3px', background: '#E5DEEC' }}>
        <div
          className="rounded-full transition-all duration-300"
          style={{
            height: '3px',
            width: `${((step + 1) / TOUR_STEPS.length) * 100}%`,
            background: 'linear-gradient(90deg, #5D4AA8, #8A6FBE)',
          }}
        />
      </div>

      {/* Step content */}
      <div className="mb-4">
        <h3 className="font-semibold mb-1.5" style={{ fontSize: '15px', color: '#1E1830' }}>
          {current.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: '#3D3450' }}>
          {current.description}
        </p>
      </div>

      {/* Tip box */}
      <div
        className="rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2"
        style={{ background: 'rgba(93,74,168,0.07)', border: '1px solid rgba(93,74,168,0.12)' }}
      >
        <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: '#5D4AA8' }}>ⓘ</span>
        <p className="text-xs leading-relaxed" style={{ color: '#5D4AA8' }}>
          {current.tip}
        </p>
      </div>

      {/* Booking link on last step */}
      {isLast && businessId && (
        <div
          className="rounded-xl px-3 py-2.5 mb-4 flex items-center justify-between gap-3"
          style={{ background: '#fff', border: '1px solid #EFE9F2' }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium mb-0.5" style={{ color: '#7A7090' }}>Your booking page</p>
            <p className="text-sm font-medium truncate" style={{ color: '#5D4AA8' }}>
              /book/{businessId}
            </p>
          </div>
          <Link
            href={bookingHref}
            target="_blank"
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }}
          >
            Open →
          </Link>
        </div>
      )}

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
