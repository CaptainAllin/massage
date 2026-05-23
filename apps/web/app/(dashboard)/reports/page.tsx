'use client';

import { useState } from 'react';
import { ReportBuilder } from '../../../components/reports/ReportBuilder';
import { ReportViewer } from '../../../components/reports/ReportViewer';
import type { ReportType } from '../../../lib/hooks/use-reports';
import { useTherapists } from '../../../lib/hooks/use-therapists';
import { useBusinessId } from '../../../lib/hooks/use-business-id';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const businessId = useBusinessId();

  // Fetch therapists for filtering
  const { data: therapists = [] } = useTherapists(businessId, {
    isActive: true,
  });

  const handleReportGenerated = (data: any, type: ReportType) => {
    setReportData(data);
    setReportType(type);
  };

  const handleCloseReport = () => {
    setReportData(null);
    setReportType(null);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export report', reportType, reportData);
  };

  // Get unique service types from therapists (simplified - in production this should come from appointments)
  const serviceTypes = ['Swedish Massage', 'Deep Tissue', 'Sports Massage', 'Hot Stone'];

  const therapistOptions = therapists.map(t => ({
    id: t.id,
    name: t.id,
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Generate comprehensive reports to analyze your business performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Builder */}
        <div className="lg:col-span-1">
          <ReportBuilder
            onReportGenerated={handleReportGenerated}
            therapists={therapistOptions}
            serviceTypes={serviceTypes}
          />
        </div>

        {/* Report Viewer */}
        <div className="lg:col-span-2">
          {reportData && reportType ? (
            <ReportViewer
              reportType={reportType}
              data={reportData}
              onExport={handleExport}
              onClose={handleCloseReport}
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-lg">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Select a report type and generate a report to view results here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
