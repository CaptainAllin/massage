import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Therapist, TherapistFilters, ApiResponse } from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Fetch all therapists
 */
export function useTherapists(businessId: string, filters?: TherapistFilters) {
  return useQuery({
    queryKey: ['therapists', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.specialization && { specialization: filters.specialization }),
      });

      const response = await fetch(`${API_URL}/therapists?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch therapists');
      const data: ApiResponse<Therapist[]> = await response.json();
      return data.data;
    },
    enabled: !!businessId,
  });
}

/**
 * Fetch single therapist
 */
export function useTherapist(therapistId: string, businessId: string) {
  return useQuery({
    queryKey: ['therapist', therapistId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/therapists/${therapistId}?businessId=${businessId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch therapist');
      const data: ApiResponse<Therapist> = await response.json();
      return data.data;
    },
    enabled: !!therapistId && !!businessId,
  });
}

/**
 * Create therapist mutation
 */
export function useCreateTherapist(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (therapistData: Partial<Therapist>) => {
      const response = await fetch(`${API_URL}/therapists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...therapistData }),
      });

      if (!response.ok) throw new Error('Failed to create therapist');
      const data: ApiResponse<Therapist> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapists', businessId] });
    },
  });
}

/**
 * Update therapist mutation
 */
export function useUpdateTherapist(therapistId: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (therapistData: Partial<Therapist>) => {
      const response = await fetch(
        `${API_URL}/therapists/${therapistId}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(therapistData),
        }
      );

      if (!response.ok) throw new Error('Failed to update therapist');
      const data: ApiResponse<Therapist> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist', therapistId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['therapists', businessId] });
    },
  });
}

/**
 * Delete therapist mutation
 */
export function useDeleteTherapist(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (therapistId: string) => {
      const response = await fetch(
        `${API_URL}/therapists/${therapistId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete therapist');
      const data: ApiResponse<Therapist> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapists', businessId] });
    },
  });
}
