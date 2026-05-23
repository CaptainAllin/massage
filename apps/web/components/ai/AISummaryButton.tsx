'use client';

import { useState } from 'react';
import { Button } from '@massage/ui';
import { Sparkles, Loader2 } from 'lucide-react';

interface AISummaryButtonProps {
  onGenerate: () => Promise<any>;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'outline' | 'primary';
}

export function AISummaryButton({
  onGenerate,
  isLoading = false,
  disabled = false,
  variant = 'outline',
}: AISummaryButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleClick = async () => {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  const isDisabled = disabled || isLoading || generating;

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      disabled={isDisabled}
      className="flex items-center gap-2"
    >
      {generating || isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating Summary...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Generate AI Summary
        </>
      )}
    </Button>
  );
}
