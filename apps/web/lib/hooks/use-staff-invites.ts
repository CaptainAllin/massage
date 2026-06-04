import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PermissionOverrides } from '@/lib/permissions';

export function useStaffInvites(businessId: string | undefined) {
  return useQuery({
    queryKey: ['staff-invites', businessId],
    queryFn: async () => {
      const res = await apiClient.get(`/staff-invites?businessId=${businessId}`);
      return (res.data as any).data as any[];
    },
    enabled: !!businessId,
  });
}

export function useSendStaffInvite(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const res = await apiClient.post('/staff-invites', { ...data, businessId });
      return (res.data as any).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-invites', businessId] });
    },
  });
}

export function useCancelStaffInvite(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await apiClient.delete(`/staff-invites/${inviteId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-invites', businessId] });
    },
  });
}

export function useResendStaffInvite(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await apiClient.post(`/staff-invites/${inviteId}/resend`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-invites', businessId] });
    },
  });
}

export function useBusinessMembers(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-members', businessId],
    queryFn: async () => {
      const res = await apiClient.get(`/business-members?businessId=${businessId}`);
      return (res.data as any).data as any[];
    },
    enabled: !!businessId,
  });
}

export function useUpdateBusinessMember(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; role?: string; status?: string }) => {
      const res = await apiClient.patch(`/business-members/${id}`, data);
      return (res.data as any).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-members', businessId] });
    },
  });
}

export function useUpdateMemberPermissions(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: PermissionOverrides | null }) => {
      const res = await apiClient.patch(`/business-members/${id}`, { permissions });
      return (res.data as any).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-members', businessId] });
      qc.invalidateQueries({ queryKey: ['business-member-role'] });
    },
  });
}

export function useRolePermissions(businessId: string | undefined) {
  return useQuery({
    queryKey: ['role-permissions', businessId],
    queryFn: async () => {
      const res = await apiClient.get(`/businesses/${businessId}/role-permissions`);
      return (res.data as any).data as Record<string, { grant: string[]; revoke: string[] }>;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateRolePermissions(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ role, grant, revoke }: { role: string; grant: string[]; revoke: string[] }) => {
      const res = await apiClient.patch(`/businesses/${businessId}/role-permissions`, { role, grant, revoke });
      return (res.data as any).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-permissions', businessId] });
      qc.invalidateQueries({ queryKey: ['business-member-role'] });
    },
  });
}

export function useRemoveBusinessMember(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient.delete(`/business-members/${memberId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-members', businessId] });
    },
  });
}
