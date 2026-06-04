import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useServices(businessId: string | undefined) {
  return useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/services?businessId=${businessId}`);
      return response.data.data as any[];
    },
    enabled: !!businessId,
  });
}

export function useCreateService(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/services', { ...data, businessId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services', businessId] }),
  });
}

export function useUpdateService(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiClient.patch(`/services/${id}`, data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services', businessId] }),
  });
}

export function useDeleteService(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/services/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services', businessId] }),
  });
}
