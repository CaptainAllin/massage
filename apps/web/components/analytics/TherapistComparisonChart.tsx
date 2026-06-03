'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '@massage/ui';
import { formatCurrency as fmtCurrency } from '@/lib/format';

export interface TherapistPerformanceData {
  id: string;
  name: string;
  revenue: number;
  sessions: number;
  completionRate: number;
}

interface TherapistComparisonChartProps {
  data: TherapistPerformanceData[];
  title?: string;
  metric?: 'revenue' | 'sessions';
  currency?: string;
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function TherapistComparisonChart({
  data,
  title = 'Therapist Performance',
  metric = 'revenue',
  currency = 'AUD',
}: TherapistComparisonChartProps) {
  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      displayRevenue: item.revenue / 100, // Convert cents to dollars
      // Truncate long names
      shortName: item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name,
    }));
  }, [data]);

  const formatCurrency = (value: number) =>
    fmtCurrency(value, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const therapist = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{therapist.name}</p>
          <p className="mt-1 text-sm text-gray-600">
            Revenue: <span className="font-semibold">{formatCurrency(therapist.displayRevenue)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Sessions: <span className="font-semibold">{therapist.sessions}</span>
          </p>
          <p className="text-sm text-gray-600">
            Completion Rate: <span className="font-semibold">{therapist.completionRate.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const dataKey = metric === 'revenue' ? 'displayRevenue' : 'sessions';
  const yAxisFormatter = metric === 'revenue' ? formatCurrency : (value: number) => value.toString();
  const metricLabel = metric === 'revenue' ? 'Revenue' : 'Sessions';

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="shortName"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={{ stroke: '#e5e7eb' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar
            dataKey={dataKey}
            name={metricLabel}
            radius={[8, 8, 0, 0]}
          >
            {formattedData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {formattedData.length === 0 && (
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-sm text-gray-500">No therapist data available for this period</p>
        </div>
      )}
    </Card>
  );
}
