'use client';

import { useState } from 'react';
import { Button } from '@massage/ui';
import {
  useGenerateTreatmentSuggestions,
  useTrackSuggestionFeedback,
  type TreatmentSuggestion,
} from '../../lib/hooks/use-treatment-suggestions';
import { SuggestionCard } from './SuggestionCard';
import { FeedbackButtons } from './FeedbackButtons';

interface TreatmentSuggestionsPanelProps {
  clientId: string;
  clientName: string;
  currentComplaints?: string;
  onClose?: () => void;
}

export function TreatmentSuggestionsPanel({
  clientId,
  clientName,
  currentComplaints,
  onClose,
}: TreatmentSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<TreatmentSuggestion | null>(null);
  const [suggestionMetadata, setSuggestionMetadata] = useState<any>(null);
  const [currentComplaintsInput, setCurrentComplaintsInput] = useState(
    currentComplaints || '',
  );

  const generateMutation = useGenerateTreatmentSuggestions();
  const trackFeedbackMutation = useTrackSuggestionFeedback();

  const handleGenerateSuggestions = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        clientId,
        currentComplaints: currentComplaintsInput || undefined,
      });
      setSuggestions(result.suggestions);
      setSuggestionMetadata(result.metadata);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  const handleFeedback = async (helpful: boolean, comment?: string) => {
    try {
      await trackFeedbackMutation.mutateAsync({
        clientId,
        helpful,
        suggestionId: suggestionMetadata?.templateId,
        comment,
      });
    } catch (error) {
      console.error('Failed to track feedback:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-sage-200">
      {/* Header */}
      <div className="border-b border-sage-200 bg-sage-50 px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-sage-900">
              AI Treatment Suggestions
            </h2>
            <p className="text-sm text-sage-600 mt-1">
              For {clientName}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sage-500 hover:text-sage-700 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {!suggestions ? (
          <>
            {/* Input Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-sage-700 mb-2">
                Current Complaints (Optional)
              </label>
              <textarea
                value={currentComplaintsInput}
                onChange={(e) => setCurrentComplaintsInput(e.target.value)}
                placeholder="e.g., Lower back pain, worse when sitting for long periods..."
                className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent resize-none"
                rows={3}
              />
              <p className="text-xs text-sage-500 mt-2">
                AI will analyze client history, medical conditions, and previous sessions to generate personalized suggestions.
              </p>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateSuggestions}
              disabled={generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Generating Suggestions...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Generate AI Suggestions
                </div>
              )}
            </Button>

            {generateMutation.isError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Failed to generate suggestions. Please try again.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Suggestions Display */}
            <div className="space-y-6">
              {/* Focus Areas */}
              {suggestions.focusAreas.length > 0 && (
                <SuggestionCard
                  title="Focus Areas"
                  icon="target"
                  variant="primary"
                >
                  <div className="space-y-3">
                    {suggestions.focusAreas
                      .sort((a, b) => b.priority - a.priority)
                      .map((area, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-sage-50 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                                area.priority === 3
                                  ? 'bg-red-100 text-red-700'
                                  : area.priority === 2
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sage-900">{area.area}</h4>
                            <p className="text-sm text-sage-600 mt-1">{area.reason}</p>
                            <span
                              className={`inline-block text-xs font-medium mt-2 px-2 py-1 rounded ${
                                area.priority === 3
                                  ? 'bg-red-100 text-red-700'
                                  : area.priority === 2
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {area.priority === 3 ? 'High' : area.priority === 2 ? 'Medium' : 'Low'} Priority
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </SuggestionCard>
              )}

              {/* Techniques */}
              {suggestions.techniques.length > 0 && (
                <SuggestionCard
                  title="Suggested Techniques"
                  icon="tools"
                  variant="secondary"
                >
                  <div className="space-y-3">
                    {suggestions.techniques.map((technique, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">{technique.technique}</h4>
                        <p className="text-sm text-blue-700 mt-1">{technique.description}</p>
                        {technique.duration && (
                          <span className="inline-block text-xs text-blue-600 mt-2">
                            Duration: {technique.duration}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </SuggestionCard>
              )}

              {/* Contraindications */}
              {suggestions.contraindications.length > 0 && (
                <SuggestionCard
                  title="Contraindications"
                  icon="warning"
                  variant="warning"
                >
                  <div className="space-y-3">
                    {suggestions.contraindications.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          item.severity === 'HIGH'
                            ? 'bg-red-50 border-red-500'
                            : item.severity === 'MEDIUM'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-orange-50 border-orange-500'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <svg
                            className={`w-5 h-5 flex-shrink-0 ${
                              item.severity === 'HIGH'
                                ? 'text-red-600'
                                : item.severity === 'MEDIUM'
                                ? 'text-yellow-600'
                                : 'text-orange-600'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.warning}</p>
                            <span
                              className={`inline-block text-xs font-medium mt-1 px-2 py-0.5 rounded ${
                                item.severity === 'HIGH'
                                  ? 'bg-red-100 text-red-700'
                                  : item.severity === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {item.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SuggestionCard>
              )}

              {/* Expected Outcomes */}
              {suggestions.expectedOutcomes.length > 0 && (
                <SuggestionCard
                  title="Expected Outcomes"
                  icon="chart"
                  variant="success"
                >
                  <ul className="space-y-2">
                    {suggestions.expectedOutcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg
                          className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
                        <span className="text-sm text-sage-700">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </SuggestionCard>
              )}

              {/* Session Notes */}
              {suggestions.sessionNotes && (
                <div className="p-4 bg-sage-50 border border-sage-200 rounded-lg">
                  <h4 className="font-medium text-sage-900 mb-2">Additional Notes</h4>
                  <p className="text-sm text-sage-700 whitespace-pre-wrap">
                    {suggestions.sessionNotes}
                  </p>
                </div>
              )}

              {/* Feedback Section */}
              <div className="pt-6 border-t border-sage-200">
                <FeedbackButtons
                  onFeedback={handleFeedback}
                  isSubmitting={trackFeedbackMutation.isPending}
                />
              </div>

              {/* Metadata */}
              {suggestionMetadata && (
                <div className="text-xs text-sage-500 text-center pt-4">
                  Generated using {suggestionMetadata.model} • Cost: ${suggestionMetadata.cost.toFixed(4)}
                </div>
              )}

              {/* Regenerate Button */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setSuggestions(null);
                    setSuggestionMetadata(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Regenerate
                </Button>
                {onClose && (
                  <Button onClick={onClose} className="flex-1">
                    Close
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
