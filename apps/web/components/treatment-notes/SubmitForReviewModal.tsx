'use client';

import { useState } from 'react';
import { Button } from '@massage/ui';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useSubmitNoteForReview } from '@/lib/hooks/use-treatment-notes';

interface SubmitForReviewModalProps {
  noteId: string;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitForReviewModal({ noteId, businessId, onClose, onSuccess }: SubmitForReviewModalProps) {
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const { data: therapists = [] } = useTherapists(businessId);
  const submitMutation = useSubmitNoteForReview(noteId, businessId);

  const handleSubmit = async () => {
    if (!selectedReviewerId) return;
    try {
      await submitMutation.mutateAsync(selectedReviewerId);
      onSuccess();
      onClose();
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Submit for Review</h2>
        <p className="text-sm text-gray-500 mb-5">
          Assign a supervisor to review and approve this note.
        </p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Assign Reviewer
          </label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={selectedReviewerId}
            onChange={(e) => setSelectedReviewerId(e.target.value)}
          >
            <option value="">Select a supervisor...</option>
            {therapists.map((t: any) => (
              <option key={t.userId} value={t.userId}>
                {t.user?.firstName} {t.user?.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedReviewerId || submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </div>
  );
}
