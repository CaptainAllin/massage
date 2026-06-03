'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@massage/auth';

interface FeatureItem {
  tag: 'New' | 'Improved' | 'Tip';
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    tag: 'Tip',
    title: 'Switch calendar views',
    description: 'Toggle between Day, Week, Month, and Staff views from the toolbar. Staff view shows all therapists side-by-side.',
  },
  {
    tag: 'New',
    title: 'Drag & drop rescheduling',
    description: 'Grab any scheduled or confirmed appointment and drop it into a new time slot to reschedule instantly.',
  },
  {
    tag: 'Improved',
    title: 'Therapist color-coding',
    description: 'Each therapist has a unique color on the calendar. Use the filter bar to show only their schedule.',
  },
  {
    tag: 'Tip',
    title: 'Self-booking page',
    description: 'Clients can book 24/7 at your public booking URL — no login needed. Copy the link below and share it.',
  },
];

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  New: { bg: '#E8F5E9', color: '#2D8A67' },
  Improved: { bg: '#EDE5F4', color: '#5D4AA8' },
  Tip: { bg: '#FFF3E0', color: '#C97E68' },
};

function storageKey(userId: string) {
  return `appointments_tour_dismissed_${userId}`;
}

interface AppointmentsTourProps {
  businessId?: string;
}

export function AppointmentsTour({ businessId: _businessId }: AppointmentsTourProps) {
  const { user } = useAuth();
  const userId = user?.id ?? 'anon';

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

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ fontSize: '15px', color: '#1E1830' }}>
            Calendar highlights
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
            Tips and recent updates to your appointments calendar
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0"
          style={{ color: '#7A7090', background: '#F3F4F7' }}
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-3">
        {FEATURES.map((item, i) => {
          const ts = TAG_STYLES[item.tag];
          return (
            <div
              key={i}
              className="flex items-start gap-3 pb-3"
              style={{ borderBottom: i < FEATURES.length - 1 ? '1px solid #F0EDF5' : 'none' }}
            >
              <span
                className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                style={{ background: ts.bg, color: ts.color }}
              >
                {item.tag}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#1E1830' }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
