'use client';

import { useState } from 'react';
import { AISummaryButton } from './AISummaryButton';
import { AISummaryViewer } from './AISummaryViewer';
import {
  useGenerateAISummary,
  useRegenerateAISummary,
  useUpdateAISummary,
} from '@/lib/hooks/use-treatment-notes';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AISummarySectionProps {
  noteId: string;
  businessId: string | undefined;
  currentSummary?: string;
  aiMetadata?: {
    provider?: string;
    model?: string;
    tokens?: number;
    cost?: number;
    duration?: number;
  };
}

export function AISummarySection({
  noteId,
  businessId,
  currentSummary,
  aiMetadata,
}: AISummarySectionProps) {
  const [summary, setSummary] = useState(currentSummary);
  const [metadata, setMetadata] = useState(aiMetadata);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateMutation = useGenerateAISummary(noteId, businessId);
  const regenerateMutation = useRegenerateAISummary(noteId, businessId);
  const updateMutation = useUpdateAISummary(noteId, businessId);

  const handleGenerate = async () => {
    setError(null);
    setSuccess(null);

    try {
      const result = await generateMutation.mutateAsync();
      if (result.success) {
        setSummary(result.summary);
        setMetadata(result.metadata);
        setSuccess('AI summary generated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI summary');
    }
  };

  const handleRegenerate = async () => {
    setError(null);
    setSuccess(null);

    try {
      const result = await regenerateMutation.mutateAsync();
      if (result.success) {
        setSummary(result.summary);
        setMetadata(result.metadata);
        setSuccess('AI summary regenerated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate AI summary');
    }
  };

  const handleUpdate = async (newSummary: string) => {
    setError(null);
    setSuccess(null);

    try {
      await updateMutation.mutateAsync(newSummary);
      setSummary(newSummary);
      setSuccess('AI summary updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update AI summary');
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {/* AI Summary Content */}
      {summary ? (
        <AISummaryViewer
          summary={summary}
          metadata={metadata}
          onRegenerate={handleRegenerate}
          onUpdate={handleUpdate}
          isRegenerating={regenerateMutation.isPending}
        />
      ) : (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center space-y-3">
            <p className="text-gray-600">No AI summary yet</p>
            <AISummaryButton
              onGenerate={handleGenerate}
              isLoading={generateMutation.isPending}
              variant="primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
