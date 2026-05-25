'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@massage/auth';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TourStep {
  title: string;
  description: string;
  tip: string;
  cta?: { label: string; href: string };
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Create a SOAP note',
    description:
      'Click "New SOAP Note" to start documenting a session. Select the linked appointment — this ties the note to the correct client, therapist, and date automatically so nothing needs to be entered twice.',
    tip: 'Notes pull from appointments in the last 7 days. If you don\'t see an appointment, create it in the Calendar first.',
    cta: { label: 'New SOAP Note →', href: '/treatment-notes/new' },
  },
  {
    title: 'SOAP fields — structure your session',
    description:
      'Each note has four sections: Subjective (what the client reports), Objective (what you observe), Assessment (your clinical interpretation), and Plan (next steps and follow-up). Fill in as much or as little detail as needed.',
    tip: 'All four sections are optional — you can save a partial note and come back to complete it later.',
  },
  {
    title: 'Voice recording as an input method',
    description:
      'Click the microphone icon inside any SOAP field to record a voice note. The audio is transcribed automatically and inserted into the field — ideal when you want to document while the client is still in the room.',
    tip: 'Voice transcription requires browser microphone permission. A prompt appears on first use.',
  },
  {
    title: 'Body map — annotate areas of focus',
    description:
      'Open the Body Map from within a note to mark the exact regions you worked on. Choose between front and back views, then tap any region to highlight it. The annotated map is saved with the note and visible to reviewers.',
    tip: 'Use the body map for insurance or medico-legal notes where anatomical specificity matters.',
  },
  {
    title: 'Intake forms — create, send, and review',
    description:
      'Intake Forms let you send a pre-session health questionnaire to clients via a shareable link. Create a form from a template, copy the link, and send it by email or SMS. Completed forms appear on the client\'s profile.',
    tip: 'Set a default template in Intake Forms → Templates so every new form starts with your preferred questions.',
    cta: { label: 'Open Intake Forms →', href: '/intake-forms' },
  },
  {
    title: 'Telehealth — video consultations',
    description:
      'The Telehealth page lists appointments marked as video sessions. Click "Join" to start an end-to-end encrypted call via Daily.co. After the call, you\'ll be prompted to add a SOAP note before closing.',
    tip: 'Set DAILY_API_KEY and ENABLE_DAILY=true in your environment to activate live video sessions.',
    cta: { label: 'Open Telehealth →', href: '/telehealth' },
  },
];

function storageKey(userId: string) {
  return `treatment_notes_tour_dismissed_${userId}`;
}

export function TreatmentNotesTour() {
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
          >
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 9.414V19a2 2 0 0 1-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D4AA8', letterSpacing: '0.8px' }}>
              Clinical Tools guide &middot; Step {step + 1} of {TOUR_STEPS.length}
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

      {/* CTA link */}
      {current.cta && (
        <div
          className="rounded-xl px-3 py-2.5 mb-4 flex items-center justify-between gap-3"
          style={{ background: '#fff', border: '1px solid #EFE9F2' }}
        >
          <p className="text-xs text-muted-foreground">{current.cta.label.replace(' →', '')}</p>
          <Link
            href={current.cta.href}
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
