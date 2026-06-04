'use client';

import { useEffect, useState } from 'react';

interface WelcomeModalProps {
  firstName: string;
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeModal({ firstName, onStart, onSkip }: WelcomeModalProps) {
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
        className="relative w-full max-w-md rounded-3xl pt-14 pb-8 px-8 text-center"
        style={{
          background: '#fff',
          boxShadow: '0 32px 80px rgba(93,74,168,0.24)',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(16px)',
        }}
      >
        {/* Logo orb */}
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #7665C2, #3F2F87)',
            boxShadow: '0 8px 32px rgba(93,74,168,0.42)',
          }}
        >
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
            <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1.5 13.5v-9l7 4.5-7 4.5z" fill="rgba(255,255,255,0.95)" />
          </svg>
        </div>

        <p
          className="text-xs font-semibold uppercase mb-3"
          style={{ color: '#5D4AA8', letterSpacing: '2px' }}
        >
          Welcome to Iris
        </p>
        <h1
          className="font-semibold mb-2"
          style={{ fontSize: '26px', color: '#1E1830', letterSpacing: '-0.5px', lineHeight: 1.2 }}
        >
          {firstName ? `Hey ${firstName}! 👋` : 'Welcome aboard! 👋'}
        </h1>
        <p className="text-sm mb-8" style={{ color: '#7A7090', lineHeight: 1.65 }}>
          Your practice, beautifully managed.
          <br />
          Let&apos;s get you set up in a few quick steps.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onStart}
            className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
              boxShadow: '0 8px 24px rgba(93,74,168,0.32)',
            }}
          >
            Let&apos;s get started →
          </button>
          <button
            onClick={onSkip}
            className="w-full py-3 rounded-2xl font-medium text-sm"
            style={{ color: '#7A7090' }}
          >
            Skip tour, go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
