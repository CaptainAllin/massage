'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@massage/ui';
import { useReports, type SavedReport, type ReportType, type ReportFilters } from '../../lib/hooks/use-reports';

interface SavedReportsListProps {
  businessId: string;
  onRunReport: (data: any, type: ReportType, selectedFields: string[]) => void;
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  REVENUE: 'Revenue',
  CLIENTS: 'Clients',
  THERAPISTS: 'Therapists',
  APPOINTMENTS: 'Appointments',
  FINANCIAL_SUMMARY: 'Financial Summary',
  INVOICE_AGEING: 'Invoice Ageing',
};

const SCHEDULE_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

export function SavedReportsList({ businessId, onRunReport }: SavedReportsListProps) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    loading,
    getSavedReports,
    deleteSavedReport,
    generateRevenueReport,
    generateClientReport,
    generateTherapistReport,
    generateAppointmentReport,
    generateFinancialSummaryReport,
    generateInvoiceReport,
  } = useReports();

  const fetchReports = useCallback(async () => {
    try {
      const data = await getSavedReports();
      setReports(data);
    } catch {
      // silently ignore — parent can show toast if needed
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) fetchReports();
  }, [businessId, fetchReports]);

  const handleRun = async (report: SavedReport) => {
    setRunningId(report.id);
    try {
      const filters = report.filters as ReportFilters & { selectedFields?: string[] };
      const normalizedFilters: ReportFilters = {
        ...filters,
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      };
      const selectedFields = filters.selectedFields ?? [];

      let data: any;
      switch (report.type) {
        case 'REVENUE':
          data = await generateRevenueReport(normalizedFilters);
          break;
        case 'CLIENTS':
          data = await generateClientReport(normalizedFilters);
          break;
        case 'THERAPISTS':
          data = await generateTherapistReport(normalizedFilters);
          break;
        case 'APPOINTMENTS':
          data = await generateAppointmentReport(normalizedFilters);
          break;
        case 'FINANCIAL_SUMMARY':
          data = await generateFinancialSummaryReport(normalizedFilters);
          break;
        case 'INVOICE_AGEING':
          data = await generateInvoiceReport(normalizedFilters);
          break;
      }
      onRunReport(data, report.type, selectedFields);
    } catch (err: any) {
      alert(err.message || 'Failed to run report');
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (report: SavedReport) => {
    if (!confirm(`Delete saved report "${report.name}"?`)) return;
    setDeletingId(report.id);
    try {
      await deleteSavedReport(report.id);
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch {
      alert('Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  if (!businessId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved reports yet. Generate a report and click Save to store its configuration.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {reports.map((report) => (
              <li key={report.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{report.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {REPORT_TYPE_LABELS[report.type] ?? report.type}
                    </Badge>
                    {report.schedule && (
                      <Badge variant="secondary" className="text-xs">
                        {SCHEDULE_LABELS[report.schedule] ?? report.schedule}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Saved {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRun(report)}
                    disabled={runningId === report.id}
                  >
                    {runningId === report.id ? 'Running…' : 'Run'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(report)}
                    disabled={deletingId === report.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {deletingId === report.id ? '…' : 'Delete'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
