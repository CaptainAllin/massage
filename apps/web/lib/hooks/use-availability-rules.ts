import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useAvailabilityRules(businessId: string | undefined) {
  return useQuery({
    queryKey: ['availability-rules', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/availability-rules?businessId=${businessId}`);
      return response.data as any[];
    },
    enabled: !!businessId,
  });
}

export function useCreateAvailabilityRule(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/availability-rules', { ...data, businessId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availability-rules', businessId] }),
  });
}

export function useUpdateAvailabilityRule(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiClient.patch(`/availability-rules/${id}`, { ...data, businessId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availability-rules', businessId] }),
  });
}

export function useDeleteAvailabilityRule(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/availability-rules/${id}?businessId=${businessId}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availability-rules', businessId] }),
  });
}
