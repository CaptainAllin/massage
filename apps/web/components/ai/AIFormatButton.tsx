'use client';

import React from 'react';
import { Button } from '@massage/ui';

interface AIFormatButtonProps {
  onFormat: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * Button to format raw text into SOAP structure
 */
export const AIFormatButton: React.FC<AIFormatButtonProps> = ({
  onFormat,
  isLoading = false,
  disabled = false,
}) => {
  return (
    <Button
      variant="outline"
      size="md"
      onClick={onFormat}
      isLoading={isLoading}
      disabled={disabled}
      className="gap-2"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16m-7 6h7"
        />
      </svg>
      {isLoading ? 'Formatting to SOAP...' : 'Format to SOAP with AI'}
    </Button>
  );
};
