'use client';

import { useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { InstallInstructions, IOSShareIcon } from './InstallInstructions';

export function PWAInstallBanner() {
  const { showBanner, canInstall, browserType, triggerInstall, dismissBanner } = usePWAInstall();
  const [expanded, setExpanded] = useState(false);

  if (!showBanner) return null;

  const isManual = browserType === 'ios' || browserType === 'mac-safari' || browserType === 'firefox-android' || browserType === 'chrome-android';
  const isUnsupported = browserType === 'unsupported';

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl shadow-lg overflow-hidden"
      style={{ background: '#1E1830', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
        >
          I
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Install Iris</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#A89DC8' }}>
            {canInstall && 'Add to home screen for quick access'}
            {isManual && <InstallInstructions browserType={browserType} compact />}
            {isUnsupported && 'Open in Chrome or Edge to install'}
          </p>
        </div>

        {/* Action */}
        {canInstall && (
          <button
            onClick={triggerInstall}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#5D4AA8' }}
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </button>
        )}
        {isManual && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#5D4AA8', color: '#fff' }}
          >
            {expanded ? 'Hide' : 'How?'}
          </button>
        )}
        {isUnsupported && (
          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#5D4AA8', color: '#fff' }}
          >
            <ExternalLink className="h-3 w-3" />
            Get Chrome
          </a>
        )}

        <button
          onClick={dismissBanner}
          className="flex-shrink-0 rounded-lg p-1 transition-opacity hover:opacity-70"
          style={{ color: '#A89DC8' }}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded steps for manual-install browsers */}
      {isManual && expanded && (
        <div
          className="px-4 pb-4 pt-1 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {browserType === 'ios' && (
            <div className="flex items-center gap-1.5 mb-3 text-xs" style={{ color: '#A89DC8' }}>
              <IOSShareIcon />
              <span>Look for this icon at the bottom of Safari</span>
            </div>
          )}
          <div style={{ color: '#E8E2F4' }}>
            <InstallInstructions browserType={browserType} />
          </div>
        </div>
      )}
    </div>
  );
}
