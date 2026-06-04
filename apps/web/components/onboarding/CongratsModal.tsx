'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CongratsModalProps {
  firstName: string;
  onClose: () => void;
}

const SETUP_SUMMARY = [
  { label: 'Business profile', icon: '🏢', desc: 'Your practice identity is live' },
  { label: 'First therapist', icon: '👤', desc: 'Team member added and ready' },
  { label: 'First client', icon: '🧑‍⚕️', desc: 'Client record created' },
  { label: 'First appointment', icon: '📅', desc: 'Session booked on the calendar' },
  { label: 'Booking page shared', icon: '🔗', desc: 'Clients can self-book online' },
];

export function CongratsModal({ firstName, onClose }: CongratsModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 lg:left-[230px] z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(30,24,48,0.72)',
        backdropFilter: 'blur(8px)',
        transition: 'opacity 0.25s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl pt-16 pb-8 px-8 text-center"
        style={{
          background: '#fff',
          boxShadow: '0 32px 80px rgba(93,74,168,0.24)',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(16px)',
        }}
      >
        {/* Trophy orb */}
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: 'linear-gradient(135deg, #F5A623, #E8903A)',
            boxShadow: '0 8px 32px rgba(245,166,35,0.4)',
          }}
        >
          🏆
        </div>

        <p
          className="text-xs font-semibold uppercase mb-3"
          style={{ color: '#5D4AA8', letterSpacing: '2px' }}
        >
          Setup complete
        </p>
        <h1
          className="font-semibold mb-2"
          style={{ fontSize: '24px', color: '#1E1830', letterSpacing: '-0.5px', lineHeight: 1.2 }}
        >
          {firstName ? `You're all set, ${firstName}! 🎉` : "You're all set! 🎉"}
        </h1>
        <p className="text-sm mb-6" style={{ color: '#7A7090', lineHeight: 1.65 }}>
          Your practice is up and running. Here's a summary of everything you've set up.
        </p>

        {/* Setup summary list */}
        <div className="space-y-2 mb-7 text-left">
          {SETUP_SUMMARY.map(item => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#F9F8FF', border: '1px solid rgba(93,74,168,0.1)' }}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>{item.label}</p>
                <p className="text-xs" style={{ color: '#7A7090' }}>{item.desc}</p>
              </div>
              <svg width="16" height="16" fill="#2D8A67" viewBox="0 0 24 24" className="flex-shrink-0">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
              boxShadow: '0 8px 24px rgba(93,74,168,0.32)',
            }}
          >
            Go to dashboard →
          </button>
          <Link
            href="/analytics"
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-medium text-sm text-center block"
            style={{ color: '#7A7090' }}
          >
            View analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
