'use client';

import React from 'react';

interface AIAutocompleteSuggestionProps {
  suggestion: string;
  onAccept: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

/**
 * Displays an inline AI autocomplete suggestion
 * User can accept with Tab key or dismiss with Esc key
 */
export const AIAutocompleteSuggestion: React.FC<AIAutocompleteSuggestionProps> = ({
  suggestion,
  onAccept,
  onDismiss,
  isLoading = false,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        onAccept();
      } else if (e.key === 'Escape' && suggestion) {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestion, onAccept, onDismiss]);

  if (!suggestion && !isLoading) return null;

  return (
    <div className="relative mt-2 p-3 bg-sage-50 border border-sage-200 rounded-md">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-sage-600">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Getting AI suggestion...</span>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-sage-700 italic">{suggestion}</p>
              <div className="flex gap-2 mt-2 text-xs text-sage-600">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-sage-300 rounded text-xs font-mono">
                    Tab
                  </kbd>
                  to accept
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-sage-300 rounded text-xs font-mono">
                    Esc
                  </kbd>
                  to dismiss
                </span>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-sage-400 hover:text-sage-600 flex-shrink-0"
              aria-label="Dismiss suggestion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
