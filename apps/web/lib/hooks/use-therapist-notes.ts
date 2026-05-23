import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TherapistNote, TherapistNoteFilters, ApiResponse } from '@massage/types';
import { apiClient } from '@/lib/api-client';

export function useTherapistNotes(businessId: string | undefined, filters?: TherapistNoteFilters) {
  return useQuery({
    queryKey: ['therapist-notes', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.isPinned !== undefined && { isPinned: String(filters.isPinned) }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const result = await apiClient.get(`/therapist-notes?${params}`);
      return result.data;
    },
    enabled: !!businessId,
  });
}

export function useTherapistNote(noteId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['therapist-note', noteId, businessId],
    queryFn: async () => {
      const result = await apiClient.get<ApiResponse<TherapistNote>>(
        `/therapist-notes/${noteId}?businessId=${businessId}`
      );
      return result.data.data;
    },
    enabled: !!noteId && !!businessId,
  });
}

export function useCreateTherapistNote(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: {
      clientId: string;
      content: string;
      isPinned?: boolean;
    }) => {
      const result = await apiClient.post<ApiResponse<TherapistNote>>('/therapist-notes', {
        businessId,
        ...noteData,
      });
      return result.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId] });
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId, { clientId: variables.clientId }] });
      }
    },
  });
}

export function useUpdateTherapistNote(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: {
      content?: string;
      isPinned?: boolean;
    }) => {
      const result = await apiClient.patch<ApiResponse<TherapistNote>>(
        `/therapist-notes/${noteId}?businessId=${businessId}`,
        noteData
      );
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId] });
    },
  });
}

export function useTogglePinTherapistNote(noteId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await apiClient.patch<ApiResponse<TherapistNote>>(
        `/therapist-notes/${noteId}/toggle-pin?businessId=${businessId}`,
        {}
      );
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId] });
    },
  });
}

export function useDeleteTherapistNote(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const result = await apiClient.delete<ApiResponse<TherapistNote>>(
        `/therapist-notes/${noteId}?businessId=${businessId}`
      );
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId] });
    },
  });
}
