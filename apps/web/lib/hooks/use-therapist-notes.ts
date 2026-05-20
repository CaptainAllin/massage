import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TherapistNote, TherapistNoteFilters, ApiResponse } from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Fetch all therapist notes (filtered by RBAC on backend)
export function useTherapistNotes(businessId: string, filters?: TherapistNoteFilters) {
  return useQuery({
    queryKey: ['therapist-notes', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.isPinned !== undefined && { isPinned: String(filters.isPinned) }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await fetch(`${API_URL}/therapist-notes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch therapist notes');
      return await response.json();
    },
    enabled: !!businessId,
  });
}

// Fetch single therapist note
export function useTherapistNote(noteId: string, businessId: string) {
  return useQuery({
    queryKey: ['therapist-note', noteId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/therapist-notes/${noteId}?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch therapist note');
      const data: ApiResponse<TherapistNote> = await response.json();
      return data.data;
    },
    enabled: !!noteId && !!businessId,
  });
}

// Create therapist note mutation
export function useCreateTherapistNote(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: {
      clientId: string;
      content: string;
      isPinned?: boolean;
    }) => {
      const response = await fetch(`${API_URL}/therapist-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...noteData }),
      });

      if (!response.ok) throw new Error('Failed to create therapist note');
      const data: ApiResponse<TherapistNote> = await response.json();
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId] });
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId, { clientId: variables.clientId }] });
      }
    },
  });
}

// Update therapist note mutation
export function useUpdateTherapistNote(noteId: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: {
      content?: string;
      isPinned?: boolean;
    }) => {
      const response = await fetch(
        `${API_URL}/therapist-notes/${noteId}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(noteData),
        }
      );

      if (!response.ok) throw new Error('Failed to update therapist note');
      const data: ApiResponse<TherapistNote> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId] });
    },
  });
}

// Toggle pin status mutation
export function useTogglePinTherapistNote(noteId: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${API_URL}/therapist-notes/${noteId}/toggle-pin?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to toggle pin');
      const data: ApiResponse<TherapistNote> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId] });
    },
  });
}

// Delete therapist note mutation
export function useDeleteTherapistNote(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(
        `${API_URL}/therapist-notes/${noteId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete therapist note');
      const data: ApiResponse<TherapistNote> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-notes', businessId] });
    },
  });
}
