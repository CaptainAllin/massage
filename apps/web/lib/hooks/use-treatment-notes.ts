import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TreatmentNote, TreatmentNoteFilters, ApiResponse } from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Fetch all treatment notes
export function useTreatmentNotes(businessId: string, filters?: TreatmentNoteFilters) {
  return useQuery({
    queryKey: ['treatment-notes', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.therapistId && { therapistId: filters.therapistId }),
        ...(filters?.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters?.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await fetch(`${API_URL}/treatment-notes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch treatment notes');
      return await response.json();
    },
    enabled: !!businessId,
  });
}

// Fetch single treatment note
export function useTreatmentNote(noteId: string, businessId: string) {
  return useQuery({
    queryKey: ['treatment-note', noteId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/treatment-notes/${noteId}?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch treatment note');
      const data: ApiResponse<TreatmentNote> = await response.json();
      return data.data;
    },
    enabled: !!noteId && !!businessId,
  });
}

// Create treatment note mutation
export function useCreateTreatmentNote(businessId: string) {
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
    }) => {
      const response = await fetch(`${API_URL}/treatment-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...noteData }),
      });

      if (!response.ok) throw new Error('Failed to create treatment note');
      const data: ApiResponse<TreatmentNote> = await response.json();
      return data.data;
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
export function useUpdateTreatmentNote(noteId: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteData: Partial<TreatmentNote>) => {
      const response = await fetch(
        `${API_URL}/treatment-notes/${noteId}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(noteData),
        }
      );

      if (!response.ok) throw new Error('Failed to update treatment note');
      const data: ApiResponse<TreatmentNote> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-note', noteId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId] });
    },
  });
}

// Delete treatment note mutation
export function useDeleteTreatmentNote(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(
        `${API_URL}/treatment-notes/${noteId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete treatment note');
      const data: ApiResponse<TreatmentNote> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-notes', businessId] });
    },
  });
}
