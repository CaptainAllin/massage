import { useState } from 'react';
import { apiClient } from '../api-client';

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  businessId?: string;
  therapistId?: string;
  serviceType?: string;
  clientId?: string;
  selectedFields?: string[];
}

export interface RevenueReportData {
  totalRevenue: number;
  byTherapist: Array<{
    therapistId: string;
    therapistName: string;
    revenue: number;
    appointmentCount: number;
  }>;
  byServiceType: Array<{
    serviceType: string;
    revenue: number;
    count: number;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: string;
    amount: number;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    prevYearRevenue: number;
  }>;
  averageInvoiceValue: number;
  tipsTotal: number;
  refundsTotal: number;
}

export interface ClientReportData {
  newClients: number;
  returningClients: number;
  retentionRate: number;
  monthlyNewVsReturning: Array<{
    month: string;
    newClients: number;
    returningClients: number;
  }>;
  clientLifetimeValue: Array<{
    clientId: string;
    clientName: string;
    totalSpent: number;
    visitCount: number;
  }>;
  topClients: Array<{
    clientId: string;
    clientName: string;
    totalSpent: number;
  }>;
  inactiveClients: Array<{
    clientId: string;
    clientName: string;
    lastVisit: Date;
    daysSinceLastVisit: number;
  }>;
}

export interface TherapistPerformanceReportData {
  therapists: Array<{
    therapistId: string;
    therapistName: string;
    sessionsCompleted: number;
    revenueGenerated: number;
    utilizationRate: number;
    rebookingRate: number;
  }>;
}

export interface AppointmentReportData {
  totalAppointments: number;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byServiceType: Array<{
    serviceType: string;
    count: number;
  }>;
  peakTimes: Array<{
    hour: number;
    dayOfWeek: number;
    count: number;
  }>;
  noShowByTherapist: Array<{
    therapistId: string;
    therapistName: string;
    total: number;
    noShows: number;
    cancellations: number;
    completed: number;
    noShowRate: number;
    cancellationRate: number;
  }>;
  avgDurationByServiceType: Array<{
    serviceType: string;
    avgDuration: number;
    count: number;
  }>;
  averageDuration: number;
}

export interface InvoiceReportData {
  ageing: {
    current: { count: number; amount: number };
    days30: { count: number; amount: number };
    days60: { count: number; amount: number };
    days90: { count: number; amount: number };
    over90: { count: number; amount: number };
  };
  outstandingByClient: Array<{
    clientName: string;
    amount: number;
    daysPastDue: number;
    status: string;
  }>;
  totalOutstanding: number;
  avgInvoiceValue: number;
  avgInvoiceValueTrend: Array<{
    month: string;
    avgValue: number;
  }>;
}

export interface FinancialSummaryReportData {
  grossRevenue: number;
  netRevenue: number;
  taxesCollected: number;
  paymentMethodBreakdown: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  refunds: number;
  chargebacks: number;
}

export type ReportType = 'REVENUE' | 'CLIENTS' | 'THERAPISTS' | 'APPOINTMENTS' | 'FINANCIAL_SUMMARY' | 'INVOICE_AGEING';
export type ReportSchedule = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface SavedReport {
  id: string;
  businessId: string;
  name: string;
  type: ReportType;
  filters: ReportFilters;
  schedule?: ReportSchedule;
  emailTo: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRevenueReport = async (filters: ReportFilters): Promise<RevenueReportData> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(filters.businessId && { businessId: filters.businessId }),
        ...(filters.therapistId && { therapistId: filters.therapistId }),
        ...(filters.serviceType && { serviceType: filters.serviceType }),
      });
      const response = await apiClient.get(`/reports/revenue?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate revenue report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateClientReport = async (filters: ReportFilters): Promise<ClientReportData> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(filters.businessId && { businessId: filters.businessId }),
      });
      const response = await apiClient.get(`/reports/clients?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate client report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateTherapistReport = async (filters: ReportFilters): Promise<TherapistPerformanceReportData> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(filters.businessId && { businessId: filters.businessId }),
        ...(filters.therapistId && { therapistId: filters.therapistId }),
      });
      const response = await apiClient.get(`/reports/therapists?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate therapist report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateAppointmentReport = async (filters: ReportFilters): Promise<AppointmentReportData> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(filters.businessId && { businessId: filters.businessId }),
        ...(filters.therapistId && { therapistId: filters.therapistId }),
        ...(filters.serviceType && { serviceType: filters.serviceType }),
      });
      const response = await apiClient.get(`/reports/appointments?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate appointment report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateFinancialSummaryReport = async (filters: ReportFilters): Promise<FinancialSummaryReportData> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(filters.businessId && { businessId: filters.businessId }),
      });
      const response = await apiClient.get(`/reports/financial-summary?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate financial summary report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceReport = async (filters: ReportFilters): Promise<InvoiceReportData> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        ...(filters.businessId && { businessId: filters.businessId }),
      });
      const response = await apiClient.get(`/reports/invoices?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate invoice report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSavedReports = async (): Promise<SavedReport[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/reports/saved');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch saved reports');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (data: {
    businessId: string;
    name: string;
    type: ReportType;
    filters: ReportFilters;
    schedule?: ReportSchedule;
    emailTo?: string[];
  }): Promise<SavedReport> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/reports/saved', data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSavedReport = async (
    id: string,
    data: Partial<{
      name: string;
      filters: ReportFilters;
      schedule: ReportSchedule;
      emailTo: string[];
      isActive: boolean;
    }>,
  ): Promise<SavedReport> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/reports/saved/${id}`, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSavedReport = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/reports/saved/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const triggerScheduledReport = async (id: string, businessId: string): Promise<{ message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/reports/saved/${id}/trigger?businessId=${businessId}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (params: {
    businessId: string;
    reportType: ReportType;
    reportName?: string;
    emailTo: string[];
    startDate: Date;
    endDate: Date;
  }): Promise<{ message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/reports/export', {
        ...params,
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateRevenueReport,
    generateClientReport,
    generateTherapistReport,
    generateAppointmentReport,
    generateFinancialSummaryReport,
    generateInvoiceReport,
    getSavedReports,
    saveReport,
    updateSavedReport,
    deleteSavedReport,
    triggerScheduledReport,
    exportReport,
  };
}
