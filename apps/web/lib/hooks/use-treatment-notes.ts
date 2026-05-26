import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TreatmentNote, TreatmentNoteFilters, ApiResponse } from '@massage/types';
import { apiClient } from '@/lib/api-client';

// Fetch all treatment notes
export function useTreatmentNotes(
  businessId: string | undefined,
  filters?: TreatmentNoteFilters & { status?: string; reviewerId?: string }
) {
  return useQuery({
    queryKey: ['treatment-notes', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.reviewerId && { reviewerId: filters.reviewerId }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await apiClient.get(`/treatment-notes?${params}`);
      return response.data;
    },
    enabled: !!businessId,
  });
}

// Fetch single treatment note
export function useTreatmentNote(noteId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['treatment-note', noteId, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<TreatmentNote>>(
        `/treatment-notes/${noteId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!noteId && !!businessId,
  });
}

// Create treatment note mutation
export function useCreateTreatmentNote(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: {
      appointmentId: string;
      clientId: string;
      therapistId: string;
      subjectiveFindings?: string;
      objectiveFindings?: string;
      assessment?: string;
      plan?: string;
      areasWorked?: string[];
      techniques?: string[];
      sessionDuration?: number;
      followUpDate?: string;
      noteTemplateId?: string | null;
      noteTemplateName?: string | null;
    }) => {
      const response = await apiClient.post<ApiResponse<TreatmentNote>>('/treatment-notes', {
        businessId,
        ...noteData,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId] });
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId, { clientId: variables.clientId }] });
      }
    },
  });
}

// Update treatment note mutation
export function useUpdateTreatmentNote(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: Partial<TreatmentNote>) => {
      const response = await apiClient.patch<ApiResponse<TreatmentNote>>(
        `/treatment-notes/${noteId}?businessId=${businessId}`,
        noteData
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId] });
    },
  });
}

// Delete treatment note mutation
export function useDeleteTreatmentNote(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiClient.delete<ApiResponse<TreatmentNote>>(
        `/treatment-notes/${noteId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId] });
    },
  });
}

// Generate AI summary for treatment note
export function useGenerateAISummary(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/treatment-notes/${noteId}/ai-summary?businessId=${businessId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-note', noteId, businessId] });
    },
  });
}

// Regenerate AI summary for treatment note
export function useRegenerateAISummary(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `/treatment-notes/${noteId}/ai-summary/regenerate?businessId=${businessId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-note', noteId, businessId] });
    },
  });
}

// Update AI summary manually
export function useUpdateAISummary(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (summary: string) => {
      const response = await apiClient.patch<ApiResponse<TreatmentNote>>(
        `/treatment-notes/${noteId}/ai-summary?businessId=${businessId}`,
        { summary }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-note', noteId, businessId] });
    },
  });
}

// Submit note for supervisor review
export function useSubmitNoteForReview(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewerId: string) => {
      const response = await apiClient.post<ApiResponse<TreatmentNote>>(
        `/treatment-notes/${noteId}/submit-review`,
        { businessId, reviewerId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId] });
    },
  });
}

// Approve a note (supervisor action)
export function useApproveNote(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<TreatmentNote>>(
        `/treatment-notes/${noteId}/approve`,
        { businessId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId] });
    },
  });
}

// Reject a note with comment (supervisor action)
export function useRejectNote(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment?: string) => {
      const response = await apiClient.post<ApiResponse<TreatmentNote>>(
        `/treatment-notes/${noteId}/reject`,
        { businessId, comment }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId] });
    },
  });
}
