import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface WaitlistEntry {
  id: string;
  businessId: string;
  clientId: string;
  therapistId: string | null;
  serviceType: string | null;
  preferredDates: string[];
  preferredTimes: string[];
  status: 'WAITING' | 'OFFERED' | 'BOOKED' | 'EXPIRED';
  offerToken: string | null;
  offerExpiresAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
  };
  therapist: {
    id: string;
    user: { firstName: string | null; lastName: string | null };
  } | null;
}

export function useWaitlist(businessId: string | undefined, filters?: { status?: string; therapistId?: string }) {
  return useQuery({
    queryKey: ['waitlist', businessId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ businessId: businessId! });
      if (filters?.status) params.set('status', filters.status);
      if (filters?.therapistId) params.set('therapistId', filters.therapistId);
      const res = await apiClient.get(`/waitlist?${params}`);
      return res.data.data as WaitlistEntry[];
    },
    enabled: !!businessId,
  });
}

export function useAddToWaitlist(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      clientId: string;
      therapistId?: string;
      serviceType?: string;
      preferredDates?: string[];
      preferredTimes?: string[];
      notes?: string;
    }) => {
      const res = await apiClient.post('/waitlist', { businessId, ...data });
      return res.data.data as WaitlistEntry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waitlist', businessId] }),
  });
}

export function useRemoveFromWaitlist(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/waitlist/${id}?businessId=${businessId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waitlist', businessId] }),
  });
}

export function useOfferWaitlistSlot(businessId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, offerExpiryHours = 24 }: { id: string; offerExpiryHours?: number }) => {
      const res = await apiClient.post(`/waitlist/${id}/offer`, { businessId, offerExpiryHours });
      return res.data.data as WaitlistEntry & { bookingLink: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waitlist', businessId] }),
  });
}
