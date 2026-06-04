import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useLoyaltyAccounts(businessId: string | undefined) {
  return useQuery({
    queryKey: ['loyalty-accounts', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/loyalty/accounts?businessId=${businessId}`);
      return response.data as any[];
    },
    enabled: !!businessId,
  });
}

export function useLoyaltyAccount(businessId: string | undefined, clientId: string | undefined) {
  return useQuery({
    queryKey: ['loyalty-account', businessId, clientId],
    queryFn: async () => {
      const response = await apiClient.get(`/loyalty/accounts/${clientId}?businessId=${businessId}`);
      return response.data;
    },
    enabled: !!businessId && !!clientId,
  });
}

export function useLoyaltySettings(businessId: string | undefined) {
  return useQuery({
    queryKey: ['loyalty-settings', businessId],
    queryFn: async () => {
      const response = await apiClient.get(`/loyalty/settings?businessId=${businessId}`);
      return response.data;
    },
    enabled: !!businessId,
  });
}

export function useUpdateLoyaltySettings(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/loyalty/settings', { ...data, businessId });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loyalty-settings', businessId] }),
  });
}

export function useAwardLoyaltyPoints(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, points, type, description, referenceId, referenceType }: any) => {
      const response = await apiClient.post(`/loyalty/accounts/${clientId}`, {
        businessId,
        points,
        type,
        description,
        referenceId,
        referenceType,
      });
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-accounts', businessId] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-account', businessId, vars.clientId] });
    },
  });
}

export function useRedeemLoyaltyPoints(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, points, description }: any) => {
      const response = await apiClient.post(`/loyalty/accounts/${clientId}/redeem`, {
        businessId,
        points,
        description,
      });
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-accounts', businessId] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-account', businessId, vars.clientId] });
    },
  });
}

export function useAwardReviewPoints(businessId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, reviewId }: { clientId: string; reviewId?: string }) => {
      const response = await apiClient.post('/loyalty/award-review', { businessId, clientId, reviewId });
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-accounts', businessId] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-account', businessId, vars.clientId] });
    },
  });
}
