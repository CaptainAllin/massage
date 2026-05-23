import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Membership,
  MembershipFilters,
  ApiResponse,
  PaginatedResponse,
  CreateMembershipDto,
  CreateMembershipWithStripeDto,
} from '@massage/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

      const response = await fetch(`${API_URL}/memberships?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch memberships');
      const result: PaginatedResponse<Membership> = await response.json();
      return result;
    },
    enabled: !!businessId,
  });
}

export function useMembership(id: string, businessId: string | undefined) {
  return useQuery({
    queryKey: ['membership', id, businessId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/memberships/${id}?businessId=${businessId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch membership');
      const data: ApiResponse<Membership> = await response.json();
      return data.data;
    },
    enabled: !!id && !!businessId,
  });
}

export function useCreateMembership(businessId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipData: CreateMembershipDto) => {
      const response = await fetch(`${API_URL}/memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...membershipData, businessId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create membership');
      }
      const data: ApiResponse<Membership> = await response.json();
      return data.data;
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
      const response = await fetch(`${API_URL}/memberships/with-stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...membershipData, businessId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create membership with Stripe');
      }
      return await response.json();
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
      const response = await fetch(`${API_URL}/memberships/${membershipId}/pause`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to pause membership');
      }
      const data: ApiResponse<Membership> = await response.json();
      return data.data;
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
      const response = await fetch(`${API_URL}/memberships/${membershipId}/resume`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resume membership');
      }
      const data: ApiResponse<Membership> = await response.json();
      return data.data;
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
      const response = await fetch(`${API_URL}/memberships/${membershipId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel membership');
      }
      const data: ApiResponse<Membership> = await response.json();
      return data.data;
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
      const response = await fetch(`${API_URL}/memberships/${membershipId}/redeem-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to redeem session');
      }
      const data: ApiResponse<Membership> = await response.json();
      return data.data;
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
      const response = await fetch(`${API_URL}/memberships/${membershipId}/sessions-remaining`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch sessions remaining');
      const data: ApiResponse<any> = await response.json();
      return data.data;
    },
    enabled: !!membershipId && !!businessId,
  });
}
