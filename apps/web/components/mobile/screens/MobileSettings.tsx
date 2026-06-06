'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LargeHeader } from '../LargeHeader';
import { Avatar, Card } from '../primitives';
import type { MobileRouter } from '../MobileShell';
import { useAuth } from '@massage/auth';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MobileSettingsProps {
  router: MobileRouter;
  param: unknown;
}

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  last?: boolean;
  onPress?: () => void;
}

// ─── Settings Row ─────────────────────────────────────────────────────────────

function SettingsRow({ icon, label, value, last = false, onPress }: SettingsRowProps) {
  return (
    <button
      className="im-tab im-press"
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        background: 'none',
        border: 'none',
        borderBottom: last ? 'none' : '1px solid var(--m-line2)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: 'var(--m-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--m-primary)',
        }}
      >
        {icon}
      </div>

      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: 500,
          color: 'var(--m-ink)',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        }}
      >
        {label}
      </span>

      {value && (
        <span
          style={{
            fontSize: 13,
            color: 'var(--m-muted)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            marginRight: 4,
          }}
        >
          {value}
        </span>
      )}

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─── Group Label ──────────────────────────────────────────────────────────────

function GroupLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: 'var(--m-muted)',
        textTransform: 'uppercase',
        letterSpacing: 1.3,
        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        marginBottom: 8,
        paddingLeft: 2,
      }}
    >
      {label}
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BuildingIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 21V10M16 21V10M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 5V3h4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a7 7 0 0 0-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="6" r="2" fill="var(--m-surface)" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="12" r="2" fill="var(--m-surface)" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="18" r="2" fill="var(--m-surface)" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── App install icon ─────────────────────────────────────────────────────────

function AppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 17v0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Install Row ──────────────────────────────────────────────────────────────

interface InstallRowProps {
  isInstalled: boolean;
  canInstall: boolean;
  hasManualInstall: boolean;
  browserType: string;
  showHelp: boolean;
  onPress: () => void;
}

function InstallRow({ isInstalled, canInstall, hasManualInstall, browserType, showHelp, onPress }: InstallRowProps) {
  const MANUAL_INSTRUCTIONS: Record<string, string> = {
    'ios':             'Tap the Share button ↑, then "Add to Home Screen"',
    'mac-safari':      'Open the File menu, then "Add to Dock"',
    'firefox-android': 'Tap the menu ⋮, then "Install"',
    'chrome-android':  'Tap the menu ⋮ in the top right, then "Add to Home Screen"',
  };
  const instructions = MANUAL_INSTRUCTIONS[browserType];

  return (
    <div>
      <button
        className="im-tab im-press"
        onClick={onPress}
        disabled={isInstalled || (!canInstall && !hasManualInstall)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 0',
          background: 'none',
          border: 'none',
          borderBottom: showHelp ? 'none' : 'none',
          cursor: isInstalled ? 'default' : 'pointer',
          textAlign: 'left',
          opacity: (!isInstalled && !canInstall && !hasManualInstall) ? 0.45 : 1,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: isInstalled ? 'rgba(62,158,122,0.12)' : 'var(--m-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: isInstalled ? 'var(--m-ok)' : 'var(--m-primary)',
          }}
        >
          <AppIcon />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 500,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            {isInstalled ? 'Iris is installed' : 'Install Iris app'}
          </div>
          {isInstalled && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--m-ok)',
                marginTop: 2,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                fontWeight: 500,
              }}
            >
              Done · Running as a standalone app
            </div>
          )}
          {!isInstalled && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--m-muted)',
                marginTop: 2,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              }}
            >
              Add to your home screen for quick access
            </div>
          )}
        </div>

        {isInstalled ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--m-ok)',
              background: 'rgba(62,158,122,0.12)',
              padding: '3px 8px',
              borderRadius: 8,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            Done
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="var(--m-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {showHelp && instructions && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--m-ink2)',
            background: 'var(--m-soft)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 8,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            lineHeight: 1.5,
          }}
        >
          {instructions}
        </div>
      )}
    </div>
  );
}

// ─── Settings Groups ──────────────────────────────────────────────────────────

const PRACTICE_ROWS = [
  { label: 'Business profile',      icon: <BuildingIcon />, route: '/settings?tab=business' },
  { label: 'Team & therapists',     icon: <UsersIcon />,    route: '/therapists' },
  { label: 'Hours & availability',  icon: <ClockIcon />,    route: '/settings?tab=booking' },
  { label: 'Booking page',          icon: <LinkIcon />,     route: '/settings?tab=booking' },
];

const ACCOUNT_ROWS = [
  { label: 'Notifications',      icon: <BellIcon />,       route: '/settings?tab=notifications' },
  { label: 'Privacy & security', icon: <ShieldIcon />,     route: '/settings?tab=security' },
  { label: 'Billing & plan',     icon: <CreditCardIcon />, route: '/settings?tab=account', value: 'Pro' },
  { label: 'Preferences',        icon: <SlidersIcon />,    route: '/settings?tab=account' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MobileSettings({ router: _router }: MobileSettingsProps) {
  const { user, signOut } = useAuth();
  const nextRouter = useRouter();
  const { canInstall, isInstalled, hasManualInstall, browserType, triggerInstall } = usePWAInstall();
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const firstName = user?.user_metadata?.first_name ?? '';
  const lastName  = user?.user_metadata?.last_name ?? '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'My Account';
  const email     = user?.email ?? '';
  const role      = user?.user_metadata?.role ?? 'Owner';

  const handleInstallPress = async () => {
    if (isInstalled) return;
    if (canInstall) {
      await triggerInstall();
    } else if (hasManualInstall) {
      setShowInstallHelp((v) => !v);
    }
  };

  return (
    <div style={{ padding: '20px 16px 8px' }}>
      <LargeHeader eyebrow="You" title="Settings" />

      {/* Profile card */}
      <Card style={{ padding: '14px 16px', marginBottom: 24 }}>
        <button
          className="im-tab im-press"
          onClick={() => nextRouter.push('/settings?tab=account')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0,
          }}
        >
          <Avatar name={fullName} size={56} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--m-ink)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--m-muted)',
                marginTop: 3,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {email}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--m-primary)',
                marginTop: 2,
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                fontWeight: 600,
              }}
            >
              {role}
            </div>
          </div>

          <ChevronRightIcon />
        </button>
      </Card>

      {/* App group */}
      <div style={{ marginBottom: 24 }}>
        <GroupLabel label="App" />
        <Card style={{ padding: '0 16px' }}>
          <InstallRow
            isInstalled={isInstalled}
            canInstall={canInstall}
            hasManualInstall={hasManualInstall}
            browserType={browserType}
            showHelp={showInstallHelp}
            onPress={handleInstallPress}
          />
        </Card>
      </div>

      {/* Practice group */}
      <div style={{ marginBottom: 24 }}>
        <GroupLabel label="Practice" />
        <Card style={{ padding: '0 16px' }}>
          {PRACTICE_ROWS.map((row, i) => (
            <SettingsRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              last={i === PRACTICE_ROWS.length - 1}
              onPress={() => nextRouter.push(row.route)}
            />
          ))}
        </Card>
      </div>

      {/* Account group */}
      <div style={{ marginBottom: 32 }}>
        <GroupLabel label="Account" />
        <Card style={{ padding: '0 16px' }}>
          {ACCOUNT_ROWS.map((row, i) => (
            <SettingsRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={'value' in row ? row.value : undefined}
              last={i === ACCOUNT_ROWS.length - 1}
              onPress={() => nextRouter.push(row.route)}
            />
          ))}
        </Card>
      </div>

      {/* Sign out */}
      <button
        className="im-tab im-press"
        onClick={() => signOut()}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          background: 'var(--m-surface)',
          border: '1.5px solid var(--m-warn)',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--m-warn)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          marginBottom: 8,
        }}
      >
        Sign out
      </button>
    </div>
  );
}
