import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useRooms(businessId: string | undefined, onlyActive = false) {
  return useQuery({
    queryKey: ['rooms', businessId, onlyActive],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      if (onlyActive) params.set('isActive', 'true');
      const response = await apiClient.get(`/rooms?${params}`);
      return response.data.data as any[];
    },
    enabled: !!businessId,
  });
}

export function useCreateRoom(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/rooms', { ...data, businessId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', businessId] }),
  });
}

export function useUpdateRoom(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiClient.patch(`/rooms/${id}`, { ...data, businessId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', businessId] }),
  });
}

export function useDeleteRoom(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/rooms/${id}?businessId=${businessId}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', businessId] }),
  });
}
