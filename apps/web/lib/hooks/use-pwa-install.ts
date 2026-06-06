'use client';

import { useEffect, useState } from 'react';

const BANNER_DISMISSED_KEY = 'pwa-banner-dismissed';
const FIRST_LOGIN_SHOWN_KEY = 'pwa-first-login-shown';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type PWABrowserType =
  | 'prompt'          // Chrome/Edge/Samsung — beforeinstallprompt fires
  | 'ios'             // iOS Safari — Share → Add to Home Screen
  | 'mac-safari'      // macOS Safari 17+ — File → Add to Dock
  | 'firefox-android' // Firefox on Android — ⋮ → Install
  | 'chrome-android'  // Chrome Android fallback — ⋮ → Add to Home Screen
  | 'unsupported';    // Firefox desktop etc. — no install path

function detectBrowser(): PWABrowserType {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafariUA = /safari/i.test(ua) && !/chrome|crios|fxios|edg/i.test(ua);
  const isMac = /macintosh/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edg/i.test(ua);

  if (isIOS && isSafariUA) return 'ios';
  if (isMac && isSafariUA) return 'mac-safari';
  if (isFirefox && isAndroid) return 'firefox-android';
  if (isFirefox) return 'unsupported';
  if (isChrome && isAndroid) return 'chrome-android';
  // For other prompt-capable browsers we return 'prompt' as the default;
  // the actual prompt availability is tracked separately via the event.
  return 'prompt';
}

export function usePWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [firstLoginShown, setFirstLoginShown] = useState(true);
  const [browserType, setBrowserType] = useState<PWABrowserType>('prompt');

  useEffect(() => {
    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsInstalled(installed);
    setBannerDismissed(!!localStorage.getItem(BANNER_DISMISSED_KEY));
    setFirstLoginShown(!!localStorage.getItem(FIRST_LOGIN_SHOWN_KEY));
    setBrowserType(detectBrowser());

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const onAppInstalled = () => setIsInstalled(true);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setPrompt(null);
    }
    return outcome === 'accepted';
  };

  const dismissBanner = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, '1');
    setBannerDismissed(true);
  };

  const markFirstLoginShown = () => {
    localStorage.setItem(FIRST_LOGIN_SHOWN_KEY, '1');
    setFirstLoginShown(true);
  };

  // beforeinstallprompt browsers: prompt is available
  const canInstall = !isInstalled && !!prompt;

  // Browsers with a manual install path (no prompt event, or prompt not yet fired)
  const hasManualInstall =
    !isInstalled &&
    (browserType === 'ios' ||
      browserType === 'mac-safari' ||
      browserType === 'firefox-android' ||
      (browserType === 'chrome-android' && !prompt));

  return {
    canInstall,
    hasManualInstall,
    isInstalled,
    browserType,
    showBanner: (canInstall || hasManualInstall) && !bannerDismissed,
    showFirstLoginModal: (canInstall || hasManualInstall) && !firstLoginShown,
    triggerInstall,
    dismissBanner,
    markFirstLoginShown,
  };
}
