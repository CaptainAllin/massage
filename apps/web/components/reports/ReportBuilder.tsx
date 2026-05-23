'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Checkbox, Modal } from '@massage/ui';
import { useReports, type ReportType, type ReportFilters, type ReportSchedule } from '../../lib/hooks/use-reports';

interface ReportBuilderProps {
  onReportGenerated: (data: any, type: ReportType, selectedFields: string[], filters: ReportFilters) => void;
  therapists?: Array<{ id: string; name: string }>;
  serviceTypes?: string[];
  businessId?: string;
}

const REPORT_FIELDS: Record<ReportType, { key: string; label: string }[]> = {
  REVENUE: [
    { key: 'byTherapist', label: 'Revenue by Therapist' },
    { key: 'byServiceType', label: 'Revenue by Service Type' },
    { key: 'byPaymentMethod', label: 'Revenue by Payment Method' },
  ],
  CLIENTS: [
    { key: 'topClients', label: 'Top Clients by Revenue' },
    { key: 'inactiveClients', label: 'Inactive Clients' },
    { key: 'clientLifetimeValue', label: 'Client Lifetime Value' },
  ],
  THERAPISTS: [
    { key: 'performanceTable', label: 'Performance Table' },
  ],
  APPOINTMENTS: [
    { key: 'byStatus', label: 'By Status' },
    { key: 'byServiceType', label: 'By Service Type' },
    { key: 'peakTimes', label: 'Peak Times' },
  ],
  FINANCIAL_SUMMARY: [
    { key: 'paymentMethodBreakdown', label: 'Payment Method Breakdown' },
  ],
};

const ALL_FIELDS_FOR = (type: ReportType) => REPORT_FIELDS[type].map(f => f.key);

export function ReportBuilder({
  onReportGenerated,
  therapists = [],
  serviceTypes = [],
  businessId,
}: ReportBuilderProps) {
  const [reportType, setReportType] = useState<ReportType>('REVENUE');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });
  const [selectedFields, setSelectedFields] = useState<Record<ReportType, string[]>>({
    REVENUE: ALL_FIELDS_FOR('REVENUE'),
    CLIENTS: ALL_FIELDS_FOR('CLIENTS'),
    THERAPISTS: ALL_FIELDS_FOR('THERAPISTS'),
    APPOINTMENTS: ALL_FIELDS_FOR('APPOINTMENTS'),
    FINANCIAL_SUMMARY: ALL_FIELDS_FOR('FINANCIAL_SUMMARY'),
  });

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveSchedule, setSaveSchedule] = useState<ReportSchedule | ''>('');
  const [saveEmail, setSaveEmail] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    loading,
    generateRevenueReport,
    generateClientReport,
    generateTherapistReport,
    generateAppointmentReport,
    generateFinancialSummaryReport,
    saveReport,
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

      onReportGenerated(reportData, reportType, selectedFields[reportType], filters);
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

    setFilters({ ...filters, startDate, endDate: new Date() });
  };

  const toggleField = (type: ReportType, key: string) => {
    setSelectedFields(prev => {
      const current = prev[type];
      const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
      return { ...prev, [type]: next };
    });
  };

  const handleSave = async () => {
    if (!businessId || !saveName.trim()) return;
    setSaveLoading(true);
    try {
      await saveReport({
        businessId,
        name: saveName.trim(),
        type: reportType,
        filters: { ...filters, selectedFields: selectedFields[reportType] },
        schedule: saveSchedule || undefined,
        emailTo: saveEmail ? saveEmail.split(',').map(e => e.trim()).filter(Boolean) : [],
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveOpen(false);
        setSaveSuccess(false);
        setSaveName('');
        setSaveSchedule('');
        setSaveEmail('');
      }, 1500);
    } catch {
      alert('Failed to save report configuration');
    } finally {
      setSaveLoading(false);
    }
  };

  const fields = REPORT_FIELDS[reportType];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type */}
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

          {/* Quick Date Presets */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Quick Date Ranges</label>
            <div className="flex flex-wrap gap-2">
              {['today', 'week', 'month', 'quarter', 'year'].map((preset) => (
                <Button key={preset} variant="outline" size="sm" onClick={() => handleDatePreset(preset)}>
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
                  setFilters({ ...filters, startDate: new Date(e.target.value) })
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
                  setFilters({ ...filters, endDate: new Date(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Therapist Filter */}
          {(reportType === 'REVENUE' || reportType === 'THERAPISTS' || reportType === 'APPOINTMENTS') &&
            therapists.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="therapist" className="block text-sm font-medium text-gray-700">Filter by Therapist (Optional)</label>
              <select
                id="therapist"
                value={filters.therapistId || 'all'}
                onChange={(e) =>
                  setFilters({ ...filters, therapistId: e.target.value === 'all' ? undefined : e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Therapists</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Service Type Filter */}
          {(reportType === 'REVENUE' || reportType === 'APPOINTMENTS') && serviceTypes.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="service-type" className="block text-sm font-medium text-gray-700">Filter by Service Type (Optional)</label>
              <select
                id="service-type"
                value={filters.serviceType || 'all'}
                onChange={(e) =>
                  setFilters({ ...filters, serviceType: e.target.value === 'all' ? undefined : e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Service Types</option>
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sections to Include */}
          {fields.length > 1 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Sections to Include</label>
              <div className="space-y-2 pl-1">
                {fields.map((field) => (
                  <Checkbox
                    key={field.key}
                    id={`field-${field.key}`}
                    label={field.label}
                    checked={selectedFields[reportType].includes(field.key)}
                    onChange={() => toggleField(reportType, field.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={loading || selectedFields[reportType].length === 0}
              className="flex-1"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            {businessId && (
              <Button variant="outline" onClick={() => setSaveOpen(true)}>
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Report Modal */}
      <Modal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save Report Configuration"
        size="sm"
      >
        <div className="space-y-4">
          {saveSuccess ? (
            <p className="text-center text-green-600 font-medium py-4">Report configuration saved!</p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Report Name *</label>
                <Input
                  placeholder="e.g. Monthly Revenue Summary"
                  value={saveName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaveName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Schedule (Optional)</label>
                <select
                  value={saveSchedule}
                  onChange={(e) => setSaveSchedule(e.target.value as ReportSchedule | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No schedule</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              {saveSchedule && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email To (comma-separated)</label>
                  <Input
                    placeholder="admin@business.com, owner@business.com"
                    value={saveEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaveEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saveLoading || !saveName.trim()}
                  className="flex-1"
                >
                  {saveLoading ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button variant="outline" onClick={() => setSaveOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
