import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface LeaveRequest {
  id: string;
  businessId: string;
  therapistId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  isAllDay: boolean;
  leaveType: 'VACATION' | 'SICK' | 'PERSONAL';
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  approvedById: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  therapist: {
    id: string;
    user: { firstName: string | null; lastName: string | null; profileImageUrl: string | null };
  };
}

export function useLeaveRequests(businessId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ['leave-requests', businessId, status],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      if (status) params.set('status', status);
      const r = await apiClient.get<{ success: boolean; data: LeaveRequest[] }>(
        `/therapist-availability/time-off?${params}`
      );
      return r.data.data;
    },
    enabled: !!businessId,
  });
}

export function useSubmitLeaveRequest(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      therapistId: string;
      startDate: string;
      endDate: string;
      reason?: string;
      leaveType?: string;
      notes?: string;
      isAllDay?: boolean;
    }) => {
      const r = await apiClient.post<{ success: boolean; data: LeaveRequest }>(
        '/therapist-availability/time-off',
        { ...data, businessId, submittedAsRequest: true }
      );
      return r.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests', businessId] });
      qc.invalidateQueries({ queryKey: ['therapist-time-off', businessId] });
    },
  });
}

export function useApproveLeaveRequest(businessId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'decline' }) => {
      const r = await apiClient.patch<{ success: boolean; data: LeaveRequest }>(
        `/therapist-availability/time-off/${id}/approve`,
        { action }
      );
      return r.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests', businessId] });
      qc.invalidateQueries({ queryKey: ['therapist-time-off', businessId] });
      qc.invalidateQueries({ queryKey: ['availability-slots'] });
    },
  });
}
