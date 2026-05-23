'use client';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@massage/ui';
import type {
  ReportType,
  RevenueReportData,
  ClientReportData,
  TherapistPerformanceReportData,
  AppointmentReportData,
  FinancialSummaryReportData,
} from '../../lib/hooks/use-reports';

interface ReportViewerProps {
  reportType: ReportType;
  data: any;
  selectedFields?: string[];
  onExport?: () => void;
  onClose?: () => void;
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 text-gray-900 ${j > 0 ? 'text-right' : ''}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportViewer({
  reportType,
  data,
  selectedFields,
  onExport,
  onClose,
}: ReportViewerProps) {
  const show = (field: string) => !selectedFields || selectedFields.length === 0 || selectedFields.includes(field);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const renderRevenueReport = (reportData: RevenueReportData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.tipsTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(reportData.refundsTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {show('byTherapist') && (
        <Card>
          <CardHeader><CardTitle>Revenue by Therapist</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Therapist', 'Appointments', 'Revenue']}
              rows={reportData.byTherapist.map((t) => [t.therapistName, t.appointmentCount, formatCurrency(t.revenue)])}
            />
          </CardContent>
        </Card>
      )}

      {show('byServiceType') && (
        <Card>
          <CardHeader><CardTitle>Revenue by Service Type</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Service Type', 'Count', 'Revenue']}
              rows={reportData.byServiceType.map((s) => [s.serviceType, s.count, formatCurrency(s.revenue)])}
            />
          </CardContent>
        </Card>
      )}

      {show('byPaymentMethod') && (
        <Card>
          <CardHeader><CardTitle>Revenue by Payment Method</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Payment Method', 'Transactions', 'Amount']}
              rows={reportData.byPaymentMethod.map((m) => [m.paymentMethod, m.count, formatCurrency(m.amount)])}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderClientReport = (reportData: ClientReportData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.newClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Returning Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.returningClients}</div>
          </CardContent>
        </Card>
      </div>

      {show('topClients') && (
        <Card>
          <CardHeader><CardTitle>Top Clients by Revenue</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Client', 'Total Spent']}
              rows={reportData.topClients.map((c) => [c.clientName, formatCurrency(c.totalSpent)])}
            />
          </CardContent>
        </Card>
      )}

      {show('inactiveClients') && reportData.inactiveClients.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Inactive Clients (90+ Days)</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Client', 'Last Visit', 'Days Inactive']}
              rows={reportData.inactiveClients.slice(0, 10).map((c) => [
                c.clientName,
                new Date(c.lastVisit).toLocaleDateString(),
                c.daysSinceLastVisit,
              ])}
            />
          </CardContent>
        </Card>
      )}

      {show('clientLifetimeValue') && reportData.clientLifetimeValue?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Client Lifetime Value</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Client', 'Visits', 'Lifetime Spend']}
              rows={reportData.clientLifetimeValue.slice(0, 10).map((c) => [
                c.clientName,
                c.visitCount,
                formatCurrency(c.totalSpent),
              ])}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTherapistReport = (reportData: TherapistPerformanceReportData) => (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Therapist Performance</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            headers={['Therapist', 'Sessions', 'Revenue', 'Utilization', 'Rebooking Rate']}
            rows={reportData.therapists.map((t) => [
              t.therapistName,
              t.sessionsCompleted,
              formatCurrency(t.revenueGenerated),
              formatPercent(t.utilizationRate),
              formatPercent(t.rebookingRate),
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderAppointmentReport = (reportData: AppointmentReportData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.averageDuration.toFixed(0)} min</div>
          </CardContent>
        </Card>
      </div>

      {show('byStatus') && (
        <Card>
          <CardHeader><CardTitle>Appointments by Status</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Status', 'Count', 'Percentage']}
              rows={reportData.byStatus.map((s) => [s.status, s.count, formatPercent(s.percentage)])}
            />
          </CardContent>
        </Card>
      )}

      {show('byServiceType') && (
        <Card>
          <CardHeader><CardTitle>Appointments by Service Type</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Service Type', 'Count']}
              rows={reportData.byServiceType.map((s) => [s.serviceType, s.count])}
            />
          </CardContent>
        </Card>
      )}

      {show('peakTimes') && reportData.peakTimes?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Peak Times</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Hour', 'Day of Week', 'Appointments']}
              rows={reportData.peakTimes.slice(0, 10).map((p) => [
                `${p.hour}:00`,
                ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][p.dayOfWeek] ?? p.dayOfWeek,
                p.count,
              ])}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderFinancialReport = (reportData: FinancialSummaryReportData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.grossRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.netRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(reportData.refunds)}</div>
          </CardContent>
        </Card>
      </div>

      {show('paymentMethodBreakdown') && (
        <Card>
          <CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Payment Method', 'Amount', 'Percentage']}
              rows={reportData.paymentMethodBreakdown.map((m) => [m.method, formatCurrency(m.amount), formatPercent(m.percentage)])}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{reportType.replace(/_/g, ' ')} Report</h2>
          <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          {onExport && (
            <Button variant="outline" onClick={onExport}>Export</Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose}>Close</Button>
          )}
        </div>
      </div>

      {reportType === 'REVENUE' && renderRevenueReport(data)}
      {reportType === 'CLIENTS' && renderClientReport(data)}
      {reportType === 'THERAPISTS' && renderTherapistReport(data)}
      {reportType === 'APPOINTMENTS' && renderAppointmentReport(data)}
      {reportType === 'FINANCIAL_SUMMARY' && renderFinancialReport(data)}
    </div>
  );
}
