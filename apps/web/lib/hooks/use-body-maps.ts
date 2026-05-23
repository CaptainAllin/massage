import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BodyMap, BodyMapFilters, ApiResponse } from '@massage/types';
import { apiClient } from '@/lib/api-client';

export function useBodyMaps(businessId: string, filters?: BodyMapFilters) {
  return useQuery({
    queryKey: ['body-maps', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.appointmentId && { appointmentId: filters.appointmentId }),
        ...(filters?.treatmentNoteId && { treatmentNoteId: filters.treatmentNoteId }),
        ...(filters?.view && { view: filters.view }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const result = await apiClient.get(`/body-maps?${params}`);
      return result.data;
    },
    enabled: !!businessId,
  });
}

export function useBodyMap(bodyMapId: string, businessId: string) {
  return useQuery({
    queryKey: ['body-map', bodyMapId, businessId],
    queryFn: async () => {
      const result = await apiClient.get<ApiResponse<BodyMap>>(
        `/body-maps/${bodyMapId}?businessId=${businessId}`
      );
      return result.data.data;
    },
    enabled: !!bodyMapId && !!businessId,
  });
}

export function useCreateBodyMap(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bodyMapData: {
      clientId: string;
      appointmentId?: string;
      treatmentNoteId?: string;
      view: string;
      regions: any[];
      notes?: string;
    }) => {
      const result = await apiClient.post<ApiResponse<BodyMap>>('/body-maps', {
        businessId,
        ...bodyMapData,
      });
      return result.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['body-maps', businessId] });
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: ['body-maps', businessId, { clientId: variables.clientId }] });
      }
    },
  });
}

export function useUpdateBodyMap(bodyMapId: string, businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bodyMapData: {
      view?: string;
      regions?: any[];
      notes?: string;
    }) => {
      const result = await apiClient.patch<ApiResponse<BodyMap>>(
        `/body-maps/${bodyMapId}?businessId=${businessId}`,
        bodyMapData
      );
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-map', bodyMapId, businessId] });
      queryClient.invalidateQueries({ queryKey: ['body-maps', businessId] });
    },
  });
}

export function useDeleteBodyMap(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bodyMapId: string) => {
      const result = await apiClient.delete<ApiResponse<BodyMap>>(
        `/body-maps/${bodyMapId}?businessId=${businessId}`
      );
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-maps', businessId] });
    },
  });
}
