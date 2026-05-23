import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useGiftCards(businessId: string | undefined, filters?: { isActive?: boolean; code?: string }) {
  return useQuery({
    queryKey: ['gift-cards', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
      if (filters?.code) params.set('code', filters.code);
      const response = await apiClient.get(`/gift-cards?${params}`);
      return response.data.data as any[];
    },
    enabled: !!businessId,
  });
}

export function useGiftCard(id: string | undefined) {
  return useQuery({
    queryKey: ['gift-card', id],
    queryFn: async () => {
      const response = await apiClient.get(`/gift-cards/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateGiftCard(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/gift-cards', { ...data, businessId });
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] }),
  });
}

export function useRedeemGiftCard(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, invoiceId, paymentId }: any) => {
      const response = await apiClient.post(`/gift-cards/${id}/redeem`, { amount, invoiceId, paymentId });
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] }),
  });
}

export function useUpdateGiftCard(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiClient.patch(`/gift-cards/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-card', vars.id] });
    },
  });
}
