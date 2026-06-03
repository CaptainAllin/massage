'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@massage/ui';
import { ArrowLeft, BarChart2, TrendingUp, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useBusiness } from '@/lib/hooks/use-business';
import { useRevenueReport } from '@/lib/hooks/use-payments';
import { formatCurrency } from '@/lib/format';

type ReportType = 'daily' | 'monthly' | 'tax';

export default function RevenueReportPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const { data: business } = useBusiness(businessId);
  const currency = (business as any)?.currency || 'AUD';
  const fmt = (n: number) => formatCurrency(n, currency);

  const [type, setType] = useState<ReportType>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useRevenueReport(businessId, type, startDate, endDate);

  const rows = data?.rows ?? [];
  const totals = data?.totals ?? {};

  const chartData = rows.map((row: any) => ({
    label: type === 'daily' ? row.date : type === 'monthly' ? row.month : row.month,
    revenue: row.revenue ?? row.total,
    refunds: row.refunds ?? 0,
    net: row.net ?? row.subtotal,
    tax: row.tax,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Revenue Reports</h1>
            <p className="text-muted-foreground mt-1">Sales, monthly summaries, and tax reports</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {(['daily', 'monthly', 'tax'] as ReportType[]).map((t) => (
                <Button
                  key={t}
                  variant={type === t ? 'primary' : 'outline'}
                  onClick={() => setType(t)}
                  className="capitalize"
                >
                  {t === 'daily' && <BarChart2 className="h-4 w-4 mr-1" />}
                  {t === 'monthly' && <TrendingUp className="h-4 w-4 mr-1" />}
                  {t === 'tax' && <Receipt className="h-4 w-4 mr-1" />}
                  {t === 'daily' ? 'Daily Sales' : t === 'monthly' ? 'Monthly Summary' : 'Tax Report'}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-600">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              />
              <label className="text-sm text-gray-600">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {type !== 'tax' ? (
            <>
              <SummaryCard label="Total Revenue" value={fmt(totals.revenue ?? 0)} color="text-green-600" />
              <SummaryCard label="Total Refunds" value={fmt(totals.refunds ?? 0)} color="text-red-500" />
              <SummaryCard label="Net Revenue" value={fmt((totals.revenue ?? 0) - (totals.refunds ?? 0))} color="text-blue-600" />
            </>
          ) : (
            <>
              <SummaryCard label="Gross Revenue" value={fmt(totals.total ?? 0)} color="text-green-600" />
              <SummaryCard label="Tax Collected" value={fmt(totals.tax ?? 0)} color="text-orange-500" />
              <SummaryCard label="Subtotal (ex. tax)" value={fmt(totals.subtotal ?? 0)} color="text-blue-600" />
            </>
          )}
        </div>
      )}

      {/* Chart */}
      {!isLoading && chartData.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {type === 'daily' ? 'Daily Revenue' : type === 'monthly' ? 'Monthly Revenue' : 'Tax by Month'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => fmt(Number(v))} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => fmt(Number(value))} />
                {type !== 'tax' ? (
                  <>
                    <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                    <Bar dataKey="refunds" fill="#ef4444" name="Refunds" />
                  </>
                ) : (
                  <>
                    <Bar dataKey="total" fill="#22c55e" name="Gross" />
                    <Bar dataKey="tax" fill="#f97316" name="Tax" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detail</h3>
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-gray-500 text-sm">No data for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">
                      {type === 'daily' ? 'Date' : 'Month'}
                    </th>
                    {type !== 'tax' ? (
                      <>
                        <th className="text-right py-2 px-3 font-semibold text-gray-600">Revenue</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-600">Refunds</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-600">Net</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-600">Count</th>
                      </>
                    ) : (
                      <>
                        <th className="text-right py-2 px-3 font-semibold text-gray-600">Subtotal</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-600">Tax</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-600">Total</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-600">Invoices</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-900">{row.date ?? row.month}</td>
                      {type !== 'tax' ? (
                        <>
                          <td className="py-2 px-3 text-right text-green-600">{fmt(row.revenue)}</td>
                          <td className="py-2 px-3 text-right text-red-500">{fmt(row.refunds)}</td>
                          <td className="py-2 px-3 text-right font-medium">{fmt(row.net)}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{row.count}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-3 text-right">{fmt(row.subtotal)}</td>
                          <td className="py-2 px-3 text-right text-orange-500">{fmt(row.tax)}</td>
                          <td className="py-2 px-3 text-right font-medium">{fmt(row.total)}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{row.count}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
