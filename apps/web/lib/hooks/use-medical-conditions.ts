import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicalCondition, MedicalConditionFilters, ApiResponse } from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Fetch all medical conditions
export function useMedicalConditions(businessId: string | undefined, filters?: MedicalConditionFilters) {
  return useQuery({
    queryKey: ['medical-conditions', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await fetch(`${API_URL}/medical-conditions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch medical conditions');
      return await response.json();
    },
    enabled: !!businessId,
  });
}

// Fetch single medical condition
export function useMedicalCondition(conditionId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['medical-condition', conditionId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/medical-conditions/${conditionId}?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch medical condition');
      const data: ApiResponse<MedicalCondition> = await response.json();
      return data.data;
    },
    enabled: !!conditionId && !!businessId,
  });
}

// Create medical condition mutation
export function useCreateMedicalCondition(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conditionData: {
      clientId: string;
      name: string;
      diagnosisDate?: string;
      status?: string;
      severity?: string;
      notes?: string;
      treatmentPlan?: string;
    }) => {
      const response = await fetch(`${API_URL}/medical-conditions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ businessId, ...conditionData }),
      });

      if (!response.ok) throw new Error('Failed to create medical condition');
      const data: ApiResponse<MedicalCondition> = await response.json();
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medical-conditions', businessId] });
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: ['medical-conditions', businessId, { clientId: variables.clientId }] });
      }
    },
  });
}

// Update medical condition mutation
export function useUpdateMedicalCondition(conditionId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conditionData: Partial<MedicalCondition>) => {
      const response = await fetch(
        `${API_URL}/medical-conditions/${conditionId}?businessId=${businessId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(conditionData),
        }
      );

      if (!response.ok) throw new Error('Failed to update medical condition');
      const data: ApiResponse<MedicalCondition> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-condition', conditionId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['medical-conditions', businessId] });
    },
  });
}

// Delete medical condition mutation
export function useDeleteMedicalCondition(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conditionId: string) => {
      const response = await fetch(
        `${API_URL}/medical-conditions/${conditionId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete medical condition');
      const data: ApiResponse<MedicalCondition> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-conditions', businessId] });
    },
  });
}
