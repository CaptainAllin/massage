import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useLocations(businessId: string | undefined) {
  return useQuery({
    queryKey: ['locations', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/locations?businessId=${businessId}`);
      return response.data as any[];
    },
    enabled: !!businessId,
  });
}

export function useCreateLocation(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/locations', { ...data, businessId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations', businessId] }),
  });
}

export function useUpdateLocation(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiClient.patch(`/locations/${id}`, data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations', businessId] }),
  });
}

export function useDeleteLocation(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/locations/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations', businessId] }),
  });
}
