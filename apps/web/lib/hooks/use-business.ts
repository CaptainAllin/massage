import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Business, ApiResponse } from '@massage/types';
import { apiClient } from '@/lib/api-client';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me');
      return response.data.data as { id: string; authUserId: string; firstName: string | null; lastName: string | null; email: string; role: string };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusiness(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Business>>(`/businesses/${businessId}`);
      return response.data.data;
    },
    enabled: !!businessId,
  });
}

export function useUpdateBusiness(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Business>) => {
      const response = await apiClient.patch<ApiResponse<Business>>(
        `/businesses/${businessId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
    },
  });
}
