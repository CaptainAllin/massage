'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@massage/auth';

export const CHECKLIST_ITEMS = [
  {
    id: 'business_profile',
    label: 'Complete your business profile',
    href: '/setup',
    description: 'Add your business name, address, and contact info',
  },
  {
    id: 'add_therapist',
    label: 'Add your first therapist',
    href: '/therapists',
    description: 'Create a therapist profile before scheduling',
  },
  {
    id: 'add_client',
    label: 'Add your first client',
    href: '/clients',
    description: 'Create or import your first client record',
  },
  {
    id: 'book_appointment',
    label: 'Book your first appointment',
    href: '/appointments',
    description: 'Schedule a session on the calendar',
  },
  {
    id: 'share_booking_link',
    label: 'Share your booking page',
    href: '/settings',
    description: 'Let clients self-book with your public link',
  },
] as const;

export type ChecklistItemId = (typeof CHECKLIST_ITEMS)[number]['id'];

function key(userId: string, suffix: string) {
  return `onboarding_${suffix}_${userId}`;
}

export function useOnboarding() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anon';

  // Default welcomeShown=true so the modal doesn't flash during hydration
  const [welcomeShown, setWelcomeShownState] = useState(true);
  const [checkedItems, setCheckedItemsState] = useState<Set<ChecklistItemId>>(new Set());
  const [checklistDismissed, setChecklistDismissedState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(key(userId, 'welcome_shown')) === 'true';
    const dismissed = localStorage.getItem(key(userId, 'checklist_dismissed')) === 'true';
    const raw = localStorage.getItem(key(userId, 'checked_items'));
    const checked = raw ? (new Set(JSON.parse(raw)) as Set<ChecklistItemId>) : new Set<ChecklistItemId>();

    setWelcomeShownState(shown);
    setChecklistDismissedState(dismissed);
    setCheckedItemsState(checked);
    setLoaded(true);
  }, [userId]);

  const setWelcomeShown = useCallback(
    (value: boolean) => {
      localStorage.setItem(key(userId, 'welcome_shown'), String(value));
      setWelcomeShownState(value);
    },
    [userId],
  );

  const toggleItem = useCallback(
    (id: ChecklistItemId) => {
      setCheckedItemsState(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        localStorage.setItem(key(userId, 'checked_items'), JSON.stringify([...next]));
        return next;
      });
    },
    [userId],
  );

  const dismissChecklist = useCallback(() => {
    localStorage.setItem(key(userId, 'checklist_dismissed'), 'true');
    setChecklistDismissedState(true);
  }, [userId]);

  const reopenChecklist = useCallback(() => {
    localStorage.setItem(key(userId, 'checklist_dismissed'), 'false');
    setChecklistDismissedState(false);
  }, [userId]);

  const completedCount = checkedItems.size;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  return {
    loaded,
    welcomeShown,
    setWelcomeShown,
    checkedItems,
    toggleItem,
    checklistDismissed,
    dismissChecklist,
    reopenChecklist,
    completedCount,
    totalCount,
    progressPct,
    allDone,
  };
}
