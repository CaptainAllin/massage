'use client';

import type { PWABrowserType } from '@/lib/hooks/use-pwa-install';

// iOS Share icon (native look)
function IOSShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

type Step = { label: string; note?: string };

function getSteps(browserType: PWABrowserType): { title: string; steps: Step[] } {
  switch (browserType) {
    case 'ios':
      return {
        title: 'Add to Home Screen',
        steps: [
          { label: 'Tap the Share button', note: 'the ↑ icon at the bottom of Safari' },
          { label: 'Scroll down and tap "Add to Home Screen"' },
          { label: 'Tap "Add" to confirm' },
        ],
      };
    case 'mac-safari':
      return {
        title: 'Add to Dock',
        steps: [
          { label: 'Click "File" in the menu bar' },
          { label: 'Click "Add to Dock…"' },
          { label: 'Click "Add" to confirm' },
        ],
      };
    case 'firefox-android':
      return {
        title: 'Add to Home Screen',
        steps: [
          { label: 'Tap the ⋮ menu in the top right' },
          { label: 'Tap "Install"' },
          { label: 'Tap "Add" to confirm' },
        ],
      };
    case 'chrome-android':
      return {
        title: 'Add to Home Screen',
        steps: [
          { label: 'Tap the ⋮ menu in the top right' },
          { label: 'Tap "Add to Home Screen" or "Install app"' },
          { label: 'Tap "Add" to confirm' },
        ],
      };
    default:
      return { title: '', steps: [] };
  }
}

interface Props {
  browserType: PWABrowserType;
  compact?: boolean;
}

export function InstallInstructions({ browserType, compact = false }: Props) {
  const { title, steps } = getSteps(browserType);
  if (!steps.length) return null;

  if (compact) {
    // One-liner hint used in the banner
    const hint =
      browserType === 'ios' ? 'Tap Share then "Add to Home Screen"' :
      browserType === 'mac-safari' ? 'File → Add to Dock in Safari' :
      browserType === 'chrome-android' ? 'Tap ⋮ menu then "Add to Home Screen"' :
      'Tap ⋮ menu then "Install"';
    return <span>{hint}</span>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold" style={{ color: '#3D3450' }}>{title}</p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-semibold text-white mt-0.5"
              style={{ background: '#5D4AA8' }}
            >
              {i + 1}
            </span>
            <span className="text-sm" style={{ color: '#3D3450' }}>
              {step.label}
              {step.note && (
                <span className="block text-xs mt-0.5" style={{ color: '#7A7090' }}>{step.note}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export { IOSShareIcon };
