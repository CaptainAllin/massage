import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Therapist, TherapistFilters, ApiResponse } from '@massage/types';
import { apiClient } from '@/lib/api-client';

export interface TherapistPerformanceRecord {
  therapistId: string;
  therapistName: string;
  sessionsCompleted: number;
  revenueGenerated: number;
  utilizationRate: number;
  rebookingRate: number;
}

export function useTherapistPerformance(
  businessId: string | undefined,
  params: { startDate: string; endDate: string; therapistId?: string },
) {
  return useQuery({
    queryKey: ['therapist-performance', businessId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        businessId: businessId!,
        startDate: params.startDate,
        endDate: params.endDate,
        ...(params.therapistId && { therapistId: params.therapistId }),
      });
      const response = await apiClient.get<{
        success: boolean;
        data: { therapists: TherapistPerformanceRecord[] };
      }>(`/reports/therapists?${searchParams}`);
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

export function useTherapists(businessId: string | undefined, filters?: TherapistFilters) {
  return useQuery({
    queryKey: ['therapists', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.isActive !== undefined && { isActive: String(filters.isActive) }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.specialization && { specialization: filters.specialization }),
      });
      const response = await apiClient.get<ApiResponse<Therapist[]>>(`/therapists?${params}`);
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

export function useTherapist(therapistId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['therapist', therapistId, businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Therapist>>(
        `/therapists/${therapistId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    enabled: !!therapistId && !!businessId,
  });
}

export function useCreateTherapist(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (therapistData: Partial<Therapist>) => {
      const response = await apiClient.post<ApiResponse<Therapist>>('/therapists', {
        ...therapistData,
        businessId,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapists', businessId] });
    },
  });
}

export function useUpdateTherapist(therapistId: string, businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (therapistData: Partial<Therapist>) => {
      const response = await apiClient.patch<ApiResponse<Therapist>>(
        `/therapists/${therapistId}`,
        { ...therapistData, businessId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist', therapistId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['therapists', businessId] });
    },
  });
}

export function useDeleteTherapist(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (therapistId: string) => {
      const response = await apiClient.delete<ApiResponse<Therapist>>(
        `/therapists/${therapistId}?businessId=${businessId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapists', businessId] });
    },
  });
}
