import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export interface RevenueKPIs {
  totalRevenue: number;
  averageTransactionValue: number;
  revenueGrowth: number;
  outstandingAmount: number;
  transactionCount: number;
  previousPeriodRevenue: number;
}

export interface ClientKPIs {
  totalActiveClients: number;
  newClients: number;
  returningClientRate: number;
  clientLifetimeValue: number;
  churnRate: number;
  newClientsGrowth: number;
  previousPeriodNewClients: number;
}

export interface AppointmentKPIs {
  totalAppointments: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  averageUtilization: number;
  appointmentsGrowth: number;
  previousPeriodAppointments: number;
}

export interface TherapistKPIs {
  activeTherapists: number;
  averageSessionsPerTherapist: number;
  topPerformer: string;
  topPerformerRevenue: number;
  utilizationRate: number;
}

export interface DashboardOverview {
  revenue: RevenueKPIs;
  clients: ClientKPIs;
  appointments: AppointmentKPIs;
  therapists: TherapistKPIs;
  generatedAt: string;
}

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export function useDashboardOverview(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', 'overview', params],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: DashboardOverview }>(
        '/analytics/overview',
        { params }
      );
      return response.data.data;
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useRevenueKPIs(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', 'revenue', params],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: RevenueKPIs }>(
        '/analytics/revenue',
        { params }
      );
      return response.data.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useClientKPIs(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', 'clients', params],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: ClientKPIs }>(
        '/analytics/clients',
        { params }
      );
      return response.data.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useAppointmentKPIs(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', 'appointments', params],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: AppointmentKPIs }>(
        '/analytics/appointments',
        { params }
      );
      return response.data.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useTherapistKPIs(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', 'therapists', params],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: TherapistKPIs }>(
        '/analytics/therapists',
        { params }
      );
      return response.data.data;
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
