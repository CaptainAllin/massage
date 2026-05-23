'use client';

import { useState } from 'react';
import { Button } from '@massage/ui';

interface FeedbackButtonsProps {
  onFeedback: (helpful: boolean, comment?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function FeedbackButtons({ onFeedback, isSubmitting }: FeedbackButtonsProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<boolean | null>(null);

  const handleFeedbackClick = async (helpful: boolean) => {
    setSelectedFeedback(helpful);

    // If not helpful, show comment box
    if (!helpful) {
      setShowCommentBox(true);
    } else {
      // If helpful, submit immediately
      await onFeedback(helpful);
      setFeedbackGiven(true);
    }
  };

  const handleSubmitComment = async () => {
    if (selectedFeedback !== null) {
      await onFeedback(selectedFeedback, comment || undefined);
      setFeedbackGiven(true);
      setShowCommentBox(false);
    }
  };

  if (feedbackGiven) {
    return (
      <div className="flex items-center justify-center space-x-2 py-4">
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm text-sage-700">Thank you for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium text-sage-700 mb-3">
          Were these suggestions helpful?
        </p>
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => handleFeedbackClick(true)}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-200 disabled:opacity-50"
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
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span>Helpful</span>
          </button>

          <button
            onClick={() => handleFeedbackClick(false)}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
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
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
              />
            </svg>
            <span>Not Helpful</span>
          </button>
        </div>
      </div>

      {showCommentBox && (
        <div className="bg-sage-50 border border-sage-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-sage-700 mb-2">
            What could be improved? (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Your feedback helps us improve AI suggestions..."
            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none text-sm"
            rows={3}
          />
          <div className="flex space-x-2 mt-3">
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting}
              size="sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            <Button
              onClick={() => {
                setShowCommentBox(false);
                setSelectedFeedback(null);
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
