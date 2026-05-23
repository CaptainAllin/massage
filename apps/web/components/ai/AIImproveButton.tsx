'use client';

import React from 'react';
import { Button } from '@massage/ui';

interface AIImproveButtonProps {
  onImprove: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  hasText?: boolean;
}

/**
 * Button to trigger AI text improvement
 */
export const AIImproveButton: React.FC<AIImproveButtonProps> = ({
  onImprove,
  isLoading = false,
  disabled = false,
  hasText = false,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onImprove}
      isLoading={isLoading}
      disabled={disabled || !hasText}
      className="gap-1.5"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      {isLoading ? 'Improving...' : 'AI Improve'}
    </Button>
  );
};
