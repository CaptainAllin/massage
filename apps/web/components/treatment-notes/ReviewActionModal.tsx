'use client';

import { useState } from 'react';
import { Button } from '@massage/ui';
import { useApproveNote, useRejectNote } from '@/lib/hooks/use-treatment-notes';

interface ReviewActionModalProps {
  noteId: string;
  businessId: string;
  action: 'approve' | 'reject';
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewActionModal({ noteId, businessId, action, onClose, onSuccess }: ReviewActionModalProps) {
  const [comment, setComment] = useState('');
  const approveMutation = useApproveNote(noteId, businessId);
  const rejectMutation = useRejectNote(noteId, businessId);
  const isApprove = action === 'approve';

  const handleConfirm = async () => {
    try {
      if (isApprove) {
        await approveMutation.mutateAsync();
      } else {
        await rejectMutation.mutateAsync(comment || undefined);
      }
      onSuccess();
      onClose();
    } catch {
      // error handled by mutation
    }
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {isApprove ? 'Approve Note' : 'Reject Note'}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          {isApprove
            ? 'This note will be locked and marked as approved.'
            : 'The note will be returned to the author with your feedback.'}
        </p>

        {!isApprove && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Feedback for author <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              rows={3}
              placeholder="What needs to be corrected?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'primary' : 'danger'}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending
              ? isApprove ? 'Approving...' : 'Rejecting...'
              : isApprove ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}
