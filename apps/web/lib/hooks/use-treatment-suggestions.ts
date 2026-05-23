import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

interface TreatmentSuggestion {
  focusAreas: Array<{
    area: string;
    reason: string;
    priority: number;
  }>;
  techniques: Array<{
    technique: string;
    description: string;
    duration?: string;
  }>;
  contraindications: Array<{
    warning: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  expectedOutcomes: string[];
  sessionNotes?: string;
}

interface GenerateSuggestionsResponse {
  suggestions: TreatmentSuggestion;
  rawResponse: string;
  metadata: {
    clientId: string;
    templateId: string;
    timestamp: string;
    cost: number;
    model: string;
  };
}

interface GenerateSuggestionsParams {
  clientId: string;
  currentComplaints?: string;
}

interface TrackFeedbackParams {
  clientId: string;
  helpful: boolean;
  suggestionId?: string;
  comment?: string;
}

/**
 * Hook for generating AI treatment suggestions
 */
export function useGenerateTreatmentSuggestions() {
  const queryClient = useQueryClient();

  return useMutation<GenerateSuggestionsResponse, Error, GenerateSuggestionsParams>({
    mutationFn: async (params) => {
      const { clientId, currentComplaints } = params;
      const response = await apiClient.post(
        `/ai/treatment-suggestions/${clientId}`,
        { currentComplaints },
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['treatment-suggestions', variables.clientId],
      });
    },
  });
}

/**
 * Hook for tracking feedback on treatment suggestions
 */
export function useTrackSuggestionFeedback() {

  return useMutation<{ success: boolean; message: string }, Error, TrackFeedbackParams>({
    mutationFn: async (params) => {
      const { clientId, helpful, suggestionId, comment } = params;
      const response = await apiClient.post(
        `/ai/treatment-suggestions/${clientId}/feedback`,
        { helpful, suggestionId, comment },
      );
      return response.data;
    },
    onSuccess: (_data, _variables) => {
    },
  });
}

export type { TreatmentSuggestion, GenerateSuggestionsResponse };
