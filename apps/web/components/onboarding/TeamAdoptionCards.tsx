'use client';

import Link from 'next/link';

interface AdoptionCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  accentBg: string;
  accentText: string;
}

const ADOPTION_CARDS: AdoptionCard[] = [
  {
    id: 'invite_therapists',
    icon: '👥',
    title: 'Invite your team',
    description: 'Share login instructions with your therapists so they can access their schedules and notes.',
    cta: 'Manage therapists',
    href: '/therapists',
    accentBg: '#EDE5F4',
    accentText: '#5D4AA8',
  },
  {
    id: 'share_booking_url',
    icon: '🔗',
    title: 'Share your booking page',
    description: 'Send your public booking link to your first real client so they can self-schedule online.',
    cta: 'Go to settings',
    href: '/settings',
    accentBg: '#E8F5F0',
    accentText: '#2D8A67',
  },
  {
    id: 'review_analytics',
    icon: '📊',
    title: 'Review your first week',
    description: 'After your first full week of bookings, check Analytics to see sessions, revenue, and client trends.',
    cta: 'Open analytics',
    href: '/analytics',
    accentBg: '#F7E5DD',
    accentText: '#C97E68',
  },
];

interface TeamAdoptionCardsProps {
  dismissedCards: Set<string>;
  onDismiss: (id: string) => void;
}

export function TeamAdoptionCards({ dismissedCards, onDismiss }: TeamAdoptionCardsProps) {
  const visible = ADOPTION_CARDS.filter(c => !dismissedCards.has(c.id));
  if (visible.length === 0) return null;

  return (
    <div>
      <p
        className="mb-3 uppercase"
        style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', color: '#5D4AA8' }}
      >
        Next steps
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {visible.map(card => (
          <div
            key={card.id}
            className="relative rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
          >
            <button
              onClick={() => onDismiss(card.id)}
              className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ color: '#B0A8C0', background: '#F3F4F7' }}
              title="Dismiss"
            >
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12">
                <line x1="10" y1="2" x2="2" y2="10" />
                <line x1="2" y1="2" x2="10" y2="10" />
              </svg>
            </button>

            <span className="text-2xl">{card.icon}</span>

            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: '#1E1830' }}>{card.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: '#7A7090' }}>{card.description}</p>
            </div>

            <Link
              href={card.href}
              className="self-start text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: card.accentBg, color: card.accentText }}
            >
              {card.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
