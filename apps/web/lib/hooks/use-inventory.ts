import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useInventory(businessId: string | undefined, filters?: { isActive?: boolean; category?: string }) {
  return useQuery({
    queryKey: ['inventory', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
      if (filters?.category) params.set('category', filters.category);
      const response = await apiClient.get(`/inventory?${params}`);
      return response.data as { products: any[]; lowStockCount: number };
    },
    enabled: !!businessId,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get(`/inventory/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/inventory', { ...data, businessId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', businessId] }),
  });
}

export function useUpdateProduct(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiClient.patch(`/inventory/${id}`, data);
      return response.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', businessId] });
      queryClient.invalidateQueries({ queryKey: ['product', vars.id] });
    },
  });
}

export function useDeleteProduct(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/inventory/${id}`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', businessId] }),
  });
}

export function useAdjustInventory(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity, type, notes, referenceId }: any) => {
      const response = await apiClient.post(`/inventory/${id}/adjust`, {
        quantity,
        type,
        notes,
        referenceId,
      });
      return response.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', businessId] });
      queryClient.invalidateQueries({ queryKey: ['product', vars.id] });
    },
  });
}
