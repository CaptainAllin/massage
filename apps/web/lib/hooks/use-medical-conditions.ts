import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicalCondition, MedicalConditionFilters, ApiResponse } from '@massage/types';
import { apiClient } from '@/lib/api-client';

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

      const result = await apiClient.get(`/medical-conditions?${params}`);
      return result.data;
    },
    enabled: !!businessId,
  });
}

export function useMedicalCondition(conditionId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['medical-condition', conditionId, businessId],
    queryFn: async () => {
      const result = await apiClient.get<ApiResponse<MedicalCondition>>(
        `/medical-conditions/${conditionId}?businessId=${businessId}`
      );
      return result.data.data;
    },
    enabled: !!conditionId && !!businessId,
  });
}

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
      const result = await apiClient.post<ApiResponse<MedicalCondition>>('/medical-conditions', {
        businessId,
        ...conditionData,
      });
      return result.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medical-conditions', businessId] });
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: ['medical-conditions', businessId, { clientId: variables.clientId }] });
      }
    },
  });
}

export function useUpdateMedicalCondition(conditionId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conditionData: Partial<MedicalCondition>) => {
      const result = await apiClient.patch<ApiResponse<MedicalCondition>>(
        `/medical-conditions/${conditionId}?businessId=${businessId}`,
        conditionData
      );
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-condition', conditionId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['medical-conditions', businessId] });
    },
  });
}

export function useDeleteMedicalCondition(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conditionId: string) => {
      const result = await apiClient.delete<ApiResponse<MedicalCondition>>(
        `/medical-conditions/${conditionId}?businessId=${businessId}`
      );
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-conditions', businessId] });
    },
  });
}
