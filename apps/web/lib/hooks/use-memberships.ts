import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Membership,
  MembershipFilters,
  ApiResponse,
  CreateMembershipDto,
  CreateMembershipWithStripeDto,
} from '@massage/types';
import { apiClient } from '@/lib/api-client';

export function useMemberships(businessId: string | undefined, filters?: MembershipFilters) {
  return useQuery({
    queryKey: ['memberships', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        businessId: businessId!,
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...(filters?.status && {
          status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
        }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const result = await apiClient.get<ApiResponse<Membership[]>>(`/memberships?${params}`);
      return result.data;
    },
    enabled: !!businessId,
  });
}

export function useMembership(id: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['membership', id, businessId],
    queryFn: async () => {
      const result = await apiClient.get<ApiResponse<Membership>>(
        `/memberships/${id}?businessId=${businessId}`
      );
      return result.data.data;
    },
    enabled: !!id && !!businessId,
  });
}

export function useCreateMembership(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipData: CreateMembershipDto) => {
      const result = await apiClient.post<ApiResponse<Membership>>('/memberships', {
        ...membershipData,
        businessId,
      });
      return result.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships', businessId] });
    },
  });
}

export function useCreateMembershipWithStripe(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipData: CreateMembershipWithStripeDto) => {
      const result = await apiClient.post('/memberships/with-stripe', {
        ...membershipData,
        businessId,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships', businessId] });
    },
  });
}

export function usePauseMembership(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const result = await apiClient.post<ApiResponse<Membership>>(
        `/memberships/${membershipId}/pause`,
        {}
      );
      return result.data.data;
    },
    onSuccess: (_, membershipId) => {
      queryClient.invalidateQueries({ queryKey: ['memberships', businessId] });
      queryClient.invalidateQueries({ queryKey: ['membership', membershipId, businessId] });
    },
  });
}

export function useResumeMembership(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const result = await apiClient.post<ApiResponse<Membership>>(
        `/memberships/${membershipId}/resume`,
        {}
      );
      return result.data.data;
    },
    onSuccess: (_, membershipId) => {
      queryClient.invalidateQueries({ queryKey: ['memberships', businessId] });
      queryClient.invalidateQueries({ queryKey: ['membership', membershipId, businessId] });
    },
  });
}

export function useCancelMembership(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const result = await apiClient.post<ApiResponse<Membership>>(
        `/memberships/${membershipId}/cancel`,
        {}
      );
      return result.data.data;
    },
    onSuccess: (_, membershipId) => {
      queryClient.invalidateQueries({ queryKey: ['memberships', businessId] });
      queryClient.invalidateQueries({ queryKey: ['membership', membershipId, businessId] });
    },
  });
}

export function useRedeemMembershipSession(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ membershipId, appointmentId }: { membershipId: string; appointmentId: string }) => {
      const result = await apiClient.post<ApiResponse<Membership>>(
        `/memberships/${membershipId}/redeem-session`,
        { appointmentId }
      );
      return result.data.data;
    },
    onSuccess: (_, { membershipId }) => {
      queryClient.invalidateQueries({ queryKey: ['memberships', businessId] });
      queryClient.invalidateQueries({ queryKey: ['membership', membershipId, businessId] });
    },
  });
}

export function useMembershipSessionsRemaining(membershipId: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['membership-sessions-remaining', membershipId, businessId],
    queryFn: async () => {
      const result = await apiClient.get<ApiResponse<any>>(
        `/memberships/${membershipId}/sessions-remaining`
      );
      return result.data.data;
    },
    enabled: !!membershipId && !!businessId,
  });
}
