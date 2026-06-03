import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SmsCreditStatus } from '@/lib/sms-credits';

export interface DashboardAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceType: string | null;
  client: { id: string; firstName: string; lastName: string } | null;
  therapist: { id: string; user: { firstName: string | null; lastName: string | null } } | null;
}

export interface DashboardData {
  todayAppointments: DashboardAppointment[];
  clientCount: number;
  revenue: { totalRevenue: number; revenueGrowth: number };
  serviceMix: Array<{ serviceType: string; count: number }>;
  smsCredits: SmsCreditStatus;
}

export function useDashboard(businessId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', businessId],
    queryFn: async () => {
      const r = await apiClient.get('/dashboard', { params: { businessId } });
      return r.data.data as DashboardData;
    },
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000,
  });
}
