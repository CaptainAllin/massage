'use client';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@massage/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { BookingHeatmap } from '../analytics/BookingHeatmap';
import type {
  ReportType,
  RevenueReportData,
  ClientReportData,
  TherapistPerformanceReportData,
  AppointmentReportData,
  FinancialSummaryReportData,
  InvoiceReportData,
} from '../../lib/hooks/use-reports';

const COLORS = ['#5D4AA8', '#7665C2', '#E8A893', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatMonth = (month: string) => {
  const [year, mo] = month.split('-');
  return new Date(parseInt(year), parseInt(mo) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

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
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-gray-400">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

interface ReportViewerProps {
  reportType: ReportType;
  data: any;
  selectedFields?: string[];
  onExport?: () => void;
  onClose?: () => void;
}

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportViewer({ reportType, data, selectedFields, onExport, onClose }: ReportViewerProps) {
  const show = (field: string) => !selectedFields || selectedFields.length === 0 || selectedFields.includes(field);

  const handleDownloadCSV = () => {
    if (reportType === 'REVENUE') {
      const d = data as RevenueReportData;
      downloadCSV('revenue-report.csv', [
        ['Therapist', 'Appointments', 'Revenue'],
        ...d.byTherapist.map(t => [t.therapistName, String(t.appointmentCount), String(t.revenue)]),
      ]);
    } else if (reportType === 'CLIENTS') {
      const d = data as ClientReportData;
      downloadCSV('clients-report.csv', [
        ['Client', 'Visits', 'Lifetime Spend'],
        ...d.clientLifetimeValue.map(c => [c.clientName, String(c.visitCount), String(c.totalSpent)]),
      ]);
    } else if (reportType === 'APPOINTMENTS') {
      const d = data as AppointmentReportData;
      downloadCSV('appointments-report.csv', [
        ['Status', 'Count', 'Percentage'],
        ...d.byStatus.map(s => [s.status, String(s.count), formatPercent(s.percentage)]),
      ]);
    } else if (reportType === 'INVOICE_AGEING') {
      const d = data as InvoiceReportData;
      downloadCSV('invoice-ageing-report.csv', [
        ['Client', 'Amount Due', 'Days Past Due', 'Status'],
        ...d.outstandingByClient.map(c => [c.clientName, String(c.amount), String(c.daysPastDue), c.status]),
      ]);
    } else if (reportType === 'THERAPISTS') {
      const d = data as TherapistPerformanceReportData;
      downloadCSV('therapist-report.csv', [
        ['Therapist', 'Sessions', 'Revenue', 'Utilization %', 'Rebooking %'],
        ...d.therapists.map(t => [t.therapistName, String(t.sessionsCompleted), String(t.revenueGenerated), String(t.utilizationRate), String(t.rebookingRate)]),
      ]);
    }
  };

  const renderRevenueReport = (d: RevenueReportData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(d.totalRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Avg Invoice Value</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(d.averageInvoiceValue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Refunds</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(d.refundsTotal)}</div></CardContent>
        </Card>
      </div>

      {show('monthlyTrend') && d.monthlyRevenue?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Monthly Revenue — Current vs. Prior Year</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={d.monthlyRevenue.map(m => ({ ...m, label: formatMonth(m.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="This Year" stroke="#5D4AA8" fill="#5D4AA8" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="prevYearRevenue" name="Prior Year" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {show('byTherapist') && d.byTherapist.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Revenue by Therapist</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.byTherapist} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="therapistName" tick={{ fontSize: 12 }} width={90} />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#5D4AA8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 border-t pt-4">
              <DataTable
                headers={['Therapist', 'Appointments', 'Revenue']}
                rows={d.byTherapist.map(t => [t.therapistName, t.appointmentCount, formatCurrency(t.revenue)])}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {show('byServiceType') && d.byServiceType.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Revenue by Service Type</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={d.byServiceType} dataKey="revenue" nameKey="serviceType" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => `${entry.serviceType} ${((entry.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {d.byServiceType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <DataTable
              headers={['Service Type', 'Count', 'Revenue']}
              rows={d.byServiceType.map(s => [s.serviceType, s.count, formatCurrency(s.revenue)])}
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
              rows={d.byPaymentMethod.map(m => [m.paymentMethod, m.count, formatCurrency(m.amount)])}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderClientReport = (d: ClientReportData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">New Clients</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{d.newClients}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Returning Clients</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{d.returningClients}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Retention Rate</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPercent(d.retentionRate ?? 0)}</div>
            <p className="text-xs text-gray-400 mt-1">% returning in period</p>
          </CardContent>
        </Card>
      </div>

      {show('monthlyTrend') && d.monthlyNewVsReturning?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>New vs. Returning Clients by Month</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.monthlyNewVsReturning.map(m => ({ ...m, label: formatMonth(m.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<PercentTooltip />} />
                <Legend />
                <Bar dataKey="newClients" name="New" fill="#5D4AA8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returningClients" name="Returning" fill="#E8A893" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {show('topClients') && (
        <Card>
          <CardHeader><CardTitle>Top Clients by Revenue</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Client', 'Total Spent']}
              rows={d.topClients.map(c => [c.clientName, formatCurrency(c.totalSpent)])}
            />
          </CardContent>
        </Card>
      )}

      {show('inactiveClients') && d.inactiveClients.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Lapsed Clients (90+ Days No Visit)</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Client', 'Last Visit', 'Days Inactive']}
              rows={d.inactiveClients.slice(0, 15).map(c => [
                c.clientName,
                new Date(c.lastVisit).toLocaleDateString(),
                c.daysSinceLastVisit,
              ])}
            />
          </CardContent>
        </Card>
      )}

      {show('clientLifetimeValue') && d.clientLifetimeValue?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Client Lifetime Value</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Client', 'Visits', 'Lifetime Spend']}
              rows={d.clientLifetimeValue.slice(0, 10).map(c => [c.clientName, c.visitCount, formatCurrency(c.totalSpent)])}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTherapistReport = (d: TherapistPerformanceReportData) => (
    <div className="space-y-6">
      {d.therapists.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Utilisation Rate by Therapist</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.therapists} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tickFormatter={v => `${v}%`} domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="therapistName" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(v: any) => `${(v as number).toFixed(1)}%`} />
                <Bar dataKey="utilizationRate" name="Utilisation %" fill="#5D4AA8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Therapist Performance</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            headers={['Therapist', 'Sessions', 'Revenue', 'Utilisation', 'Rebooking Rate']}
            rows={d.therapists.map(t => [
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

  const renderAppointmentReport = (d: AppointmentReportData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Appointments</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{d.totalAppointments}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Average Duration</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{d.averageDuration.toFixed(0)} min</div></CardContent>
        </Card>
      </div>

      {show('peakTimes') && d.peakTimes?.length > 0 && (
        <BookingHeatmap data={d.peakTimes} title="Peak Hours Heatmap (bookings by day & hour)" />
      )}

      {show('noShowByTherapist') && d.noShowByTherapist?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>No-show & Cancellation Rate by Therapist</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.noShowByTherapist} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="therapistName" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `${(v as number).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="noShowRate" name="No-show %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancellationRate" name="Cancellation %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 border-t pt-4">
              <DataTable
                headers={['Therapist', 'Total', 'No-shows', 'Cancellations', 'No-show %', 'Cancel %']}
                rows={d.noShowByTherapist.map(t => [
                  t.therapistName, t.total, t.noShows, t.cancellations,
                  formatPercent(t.noShowRate), formatPercent(t.cancellationRate),
                ])}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {show('byStatus') && (
        <Card>
          <CardHeader><CardTitle>Appointments by Status</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Status', 'Count', 'Percentage']}
              rows={d.byStatus.map(s => [s.status, s.count, formatPercent(s.percentage)])}
            />
          </CardContent>
        </Card>
      )}

      {show('avgDurationByServiceType') && d.avgDurationByServiceType?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Average Duration by Service Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.avgDurationByServiceType} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="serviceType" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tickFormatter={v => `${v}m`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => `${v} min`} />
                <Bar dataKey="avgDuration" name="Avg Duration (min)" fill="#7665C2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {show('byServiceType') && (
        <Card>
          <CardHeader><CardTitle>Appointments by Service Type</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Service Type', 'Count']}
              rows={d.byServiceType.map(s => [s.serviceType, s.count])}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderFinancialReport = (d: FinancialSummaryReportData) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Gross Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(d.grossRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Net Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(d.netRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Refunds</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(d.refunds)}</div></CardContent>
        </Card>
      </div>

      {show('paymentMethodBreakdown') && (
        <Card>
          <CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              headers={['Payment Method', 'Amount', 'Percentage']}
              rows={d.paymentMethodBreakdown.map(m => [m.method, formatCurrency(m.amount), formatPercent(m.percentage)])}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderInvoiceReport = (d: InvoiceReportData) => {
    const ageingData = [
      { label: 'Current', ...d.ageing.current },
      { label: '1–30 days', ...d.ageing.days30 },
      { label: '31–60 days', ...d.ageing.days60 },
      { label: '61–90 days', ...d.ageing.days90 },
      { label: '90+ days', ...d.ageing.over90 },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Outstanding</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(d.totalOutstanding)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Avg Invoice Value</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(d.avgInvoiceValue)}</div></CardContent>
          </Card>
        </div>

        {show('ageing') && (
          <Card>
            <CardHeader><CardTitle>Outstanding Invoices Ageing</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                    {ageingData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : i === 2 ? '#f97316' : i === 3 ? '#ef4444' : '#b91c1c'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 border-t pt-4">
                <DataTable
                  headers={['Period', 'Invoices', 'Amount Due']}
                  rows={ageingData.map(row => [row.label, row.count, formatCurrency(row.amount)])}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {show('avgInvoiceValue') && d.avgInvoiceValueTrend?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Average Invoice Value Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={d.avgInvoiceValueTrend.map(m => ({ ...m, label: formatMonth(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Line type="monotone" dataKey="avgValue" name="Avg Invoice Value" stroke="#5D4AA8" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {show('outstandingByClient') && d.outstandingByClient.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Outstanding Invoices by Client</CardTitle></CardHeader>
            <CardContent>
              <DataTable
                headers={['Client', 'Amount Due', 'Days Past Due', 'Status']}
                rows={d.outstandingByClient.map(c => [c.clientName, formatCurrency(c.amount), c.daysPastDue === 0 ? 'Current' : `${c.daysPastDue} days`, c.status])}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">{reportType.replace(/_/g, ' ')} Report</h2>
          <p className="text-sm text-gray-400">Generated {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>Download CSV</Button>
          {onExport && <Button variant="outline" size="sm" onClick={onExport}>Email Report</Button>}
          {onClose && <Button variant="outline" size="sm" onClick={onClose}>Close</Button>}
        </div>
      </div>

      {reportType === 'REVENUE' && renderRevenueReport(data)}
      {reportType === 'CLIENTS' && renderClientReport(data)}
      {reportType === 'THERAPISTS' && renderTherapistReport(data)}
      {reportType === 'APPOINTMENTS' && renderAppointmentReport(data)}
      {reportType === 'FINANCIAL_SUMMARY' && renderFinancialReport(data)}
      {reportType === 'INVOICE_AGEING' && renderInvoiceReport(data)}
    </div>
  );
}
