'use client';

import { useState } from 'react';
import { Modal, Button, Input } from '@massage/ui';
import { ReportBuilder } from '../../../components/reports/ReportBuilder';
import { ReportViewer } from '../../../components/reports/ReportViewer';
import { SavedReportsList } from '../../../components/reports/SavedReportsList';
import type { ReportType, ReportFilters } from '../../../lib/hooks/use-reports';
import { useReports } from '../../../lib/hooks/use-reports';
import { useTherapists } from '../../../lib/hooks/use-therapists';
import { useBusinessId } from '../../../lib/hooks/use-business-id';
import { useAuth } from '@massage/auth';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [reportSelectedFields, setReportSelectedFields] = useState<string[]>([]);
  const [lastFilters, setLastFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportEmail, setExportEmail] = useState('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState('');

  const businessId = useBusinessId();
  const { user } = useAuth();
  const { data: therapists = [] } = useTherapists(businessId, { isActive: true });
  const { exportReport } = useReports();

  const handleReportGenerated = (data: any, type: ReportType, selectedFields: string[], filters: ReportFilters) => {
    setReportData(data);
    setReportType(type);
    setReportSelectedFields(selectedFields);
    setLastFilters(filters);
    setTimeout(() => {
      document.getElementById('report-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCloseReport = () => {
    setReportData(null);
    setReportType(null);
    setReportSelectedFields([]);
  };

  const handleExportOpen = () => {
    setExportEmail(user?.email ?? '');
    setExportStatus('idle');
    setExportError('');
    setIsExportModalOpen(true);
  };

  const handleExport = async () => {
    if (!businessId || !reportType) return;
    const emails = exportEmail.split(',').map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      setExportError('Please enter at least one email address.');
      return;
    }
    setExportStatus('loading');
    setExportError('');
    try {
      await exportReport({
        businessId,
        reportType,
        reportName: `${reportType} Report`,
        emailTo: emails,
        startDate: lastFilters.startDate,
        endDate: lastFilters.endDate,
      });
      setExportStatus('success');
    } catch (err: any) {
      setExportStatus('error');
      setExportError(err.response?.data?.message || err.message || 'Export failed');
    }
  };

  const serviceTypes = ['Swedish Massage', 'Deep Tissue', 'Sports Massage', 'Hot Stone'];

  const therapistOptions = therapists.map(t => {
    const u = (t as any).user as { firstName?: string; lastName?: string } | undefined;
    return {
      id: t.id,
      name: u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || t.id : t.id,
    };
  });

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Generate comprehensive reports to analyze your business performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ReportBuilder
            onReportGenerated={handleReportGenerated}
            therapists={therapistOptions}
            serviceTypes={serviceTypes}
            businessId={businessId}
          />

          {businessId && (
            <SavedReportsList
              businessId={businessId}
              onRunReport={(data, type, fields) =>
                handleReportGenerated(data, type, fields, lastFilters)
              }
            />
          )}
        </div>

        <div id="report-viewer" className="lg:col-span-2">
          {reportData && reportType ? (
            <ReportViewer
              reportType={reportType}
              data={reportData}
              selectedFields={reportSelectedFields}
              onExport={handleExportOpen}
              onClose={handleCloseReport}
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-lg">
              <div className="text-center px-4">
                <p className="text-muted-foreground">
                  Select a report type and click Generate Report to view results here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Report via Email"
        size="sm"
      >
        <div className="space-y-4">
          {exportStatus === 'success' ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">Report sent successfully!</p>
              <p className="text-sm text-gray-500 mt-1">Check your inbox at {exportEmail}</p>
              <Button className="mt-4" onClick={() => setIsExportModalOpen(false)}>Close</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                The report will be generated and sent to the email addresses below.
              </p>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email addresses (comma-separated) *
                </label>
                <Input
                  type="text"
                  placeholder="admin@business.com, owner@business.com"
                  value={exportEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExportEmail(e.target.value)}
                />
                {exportError && <p className="text-sm text-red-600">{exportError}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleExport}
                  disabled={exportStatus === 'loading' || !exportEmail.trim()}
                  className="flex-1"
                >
                  {exportStatus === 'loading' ? 'Sending...' : 'Send Report'}
                </Button>
                <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
