'use client';

import Link from 'next/link';
import { CHECKLIST_ITEMS, ChecklistItemId } from '@/lib/hooks/use-onboarding';

interface GettingStartedCardProps {
  checkedItems: Set<ChecklistItemId>;
  onToggle: (id: ChecklistItemId) => void;
  onDismiss: () => void;
}

export function GettingStartedCard({ checkedItems, onToggle, onDismiss }: GettingStartedCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ fontSize: '15px', color: '#1E1830' }}>
            Getting Started
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
            Complete these steps to set up your practice
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs font-medium px-2.5 py-1 rounded-lg"
          style={{ color: '#7A7090', background: '#F3F4F7' }}
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item, i) => {
          const done = checkedItems.has(item.id);
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: done ? '#F9F8FF' : '#FAFAFA',
                border: `1px solid ${done ? 'rgba(93,74,168,0.15)' : '#F0EDF5'}`,
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggle(item.id)}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: done ? '#5D4AA8' : '#C4B8D8',
                  background: done ? '#5D4AA8' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                aria-label={done ? `Uncheck ${item.label}` : `Check ${item.label}`}
              >
                {done && (
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 12 12">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
              </button>

              {/* Label + description (entire block links to the section) */}
              <Link href={item.href} className="flex-1 min-w-0 block group">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: done ? '#9E96B0' : '#1E1830',
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {item.label}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#9E96B0' }}>
                  {item.description}
                </p>
              </Link>

              {/* Step number badge */}
              <span
                className="flex-shrink-0 text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: done ? 'transparent' : '#EDE5F4', color: done ? '#9E96B0' : '#5D4AA8' }}
              >
                {done ? (
                  <svg width="12" height="12" fill="#5D4AA8" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
