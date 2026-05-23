'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@massage/ui';
import { useReports, type ReportType, type ReportFilters } from '../../lib/hooks/use-reports';

interface ReportBuilderProps {
  onReportGenerated: (data: any, type: ReportType) => void;
  therapists?: Array<{ id: string; name: string }>;
  serviceTypes?: string[];
}

export function ReportBuilder({
  onReportGenerated,
  therapists = [],
  serviceTypes = [],
}: ReportBuilderProps) {
  const [reportType, setReportType] = useState<ReportType>('REVENUE');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  const {
    loading,
    generateRevenueReport,
    generateClientReport,
    generateTherapistReport,
    generateAppointmentReport,
    generateFinancialSummaryReport,
  } = useReports();

  const handleGenerateReport = async () => {
    try {
      let reportData: any;

      switch (reportType) {
        case 'REVENUE':
          reportData = await generateRevenueReport(filters);
          break;
        case 'CLIENTS':
          reportData = await generateClientReport(filters);
          break;
        case 'THERAPISTS':
          reportData = await generateTherapistReport(filters);
          break;
        case 'APPOINTMENTS':
          reportData = await generateAppointmentReport(filters);
          break;
        case 'FINANCIAL_SUMMARY':
          reportData = await generateFinancialSummaryReport(filters);
          break;
        default:
          throw new Error('Invalid report type');
      }

      onReportGenerated(reportData, reportType);
    } catch (error: any) {
      alert(error.message || 'Failed to generate report');
    }
  };

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    let startDate: Date;

    switch (preset) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    setFilters({
      ...filters,
      startDate,
      endDate: new Date(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <label htmlFor="report-type" className="block text-sm font-medium text-gray-700">Report Type</label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="REVENUE">Revenue Report</option>
            <option value="CLIENTS">Client Report</option>
            <option value="THERAPISTS">Therapist Performance</option>
            <option value="APPOINTMENTS">Appointment Report</option>
            <option value="FINANCIAL_SUMMARY">Financial Summary</option>
          </select>
        </div>

        {/* Date Range Presets */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Quick Date Ranges</label>
          <div className="flex flex-wrap gap-2">
            {['today', 'week', 'month', 'quarter', 'year'].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                onClick={() => handleDatePreset(preset)}
              >
                {preset === 'today' ? 'Today' :
                 preset === 'week' ? 'Last 7 Days' :
                 preset === 'month' ? 'Last 30 Days' :
                 preset === 'quarter' ? 'Last Quarter' : 'Last Year'}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate.toISOString().split('T')[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters({
                  ...filters,
                  startDate: new Date(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate.toISOString().split('T')[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilters({
                  ...filters,
                  endDate: new Date(e.target.value),
                })
              }
            />
          </div>
        </div>

        {/* Therapist Filter */}
        {(reportType === 'REVENUE' ||
          reportType === 'THERAPISTS' ||
          reportType === 'APPOINTMENTS') && therapists.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="therapist" className="block text-sm font-medium text-gray-700">Filter by Therapist (Optional)</label>
            <select
              id="therapist"
              value={filters.therapistId || 'all'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilters({
                  ...filters,
                  therapistId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Therapists</option>
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Service Type Filter */}
        {(reportType === 'REVENUE' || reportType === 'APPOINTMENTS') &&
          serviceTypes.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="service-type" className="block text-sm font-medium text-gray-700">Filter by Service Type (Optional)</label>
              <select
                id="service-type"
                value={filters.serviceType || 'all'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilters({
                    ...filters,
                    serviceType: e.target.value === 'all' ? undefined : e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Service Types</option>
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </CardContent>
    </Card>
  );
}
