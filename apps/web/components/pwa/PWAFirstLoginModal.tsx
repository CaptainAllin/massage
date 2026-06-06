'use client';

import { useEffect } from 'react';
import { Download, Zap, WifiOff, Bell } from 'lucide-react';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { InstallInstructions } from './InstallInstructions';

const BENEFITS = [
  { icon: Zap, label: 'Instant launch from your home screen' },
  { icon: WifiOff, label: 'Works offline with cached data' },
  { icon: Bell, label: 'Receive push notifications' },
];

export function PWAFirstLoginModal() {
  const {
    showFirstLoginModal,
    canInstall,
    browserType,
    triggerInstall,
    markFirstLoginShown,
  } = usePWAInstall();

  useEffect(() => {
    if (showFirstLoginModal) markFirstLoginShown();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFirstLoginModal]);

  if (!showFirstLoginModal) return null;

  const isManual = browserType === 'ios' || browserType === 'mac-safari' || browserType === 'firefox-android' || browserType === 'chrome-android';

  const handleInstall = async () => {
    await triggerInstall();
    markFirstLoginShown();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: '#FBF8FD', border: '1px solid #EFE9F2' }}
      >
        {/* App icon */}
        <div className="flex justify-center">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
            style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
          >
            I
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold" style={{ color: '#1E1830' }}>Get the Iris app</h2>
          <p className="text-sm" style={{ color: '#7A7090' }}>
            Install Iris on your device for a faster, native-like experience.
          </p>
        </div>

        {/* Benefits */}
        <ul className="space-y-2.5">
          {BENEFITS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm" style={{ color: '#3D3450' }}>
              <Icon className="h-4 w-4 flex-shrink-0" style={{ color: '#5D4AA8' }} />
              {label}
            </li>
          ))}
        </ul>

        {/* Install action — varies by browser */}
        {canInstall && (
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
            >
              <Download className="h-4 w-4" />
              Install app
            </button>
            <button
              onClick={markFirstLoginShown}
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{ color: '#7A7090' }}
            >
              Maybe later
            </button>
          </div>
        )}

        {isManual && (
          <div className="space-y-4 pt-1">
            <div
              className="rounded-xl p-4"
              style={{ background: '#F3EFF9', border: '1px solid #E0D5F0' }}
            >
              <InstallInstructions browserType={browserType} />
            </div>
            <button
              onClick={markFirstLoginShown}
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{ color: '#7A7090' }}
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
