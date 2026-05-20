'use client';

import React from 'react';
import { Card, CardContent, Button } from '@massage/ui';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onRetry,
  showRetry = true,
}) => {
  return (
    <Card className="border-red-200">
      <CardContent className="p-6 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        {showRetry && onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const InlineError: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
      <span className="text-red-600">⚠️</span>
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
};
