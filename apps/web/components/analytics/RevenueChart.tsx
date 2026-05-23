'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@massage/ui';

export interface RevenueTrendData {
  date: string;
  amount: number;
  count: number;
}

interface RevenueChartProps {
  data: RevenueTrendData[];
  title?: string;
  variant?: 'line' | 'area';
  showCount?: boolean;
}

export function RevenueChart({
  data,
  title = 'Revenue Trends',
  variant = 'area',
  showCount = false,
}: RevenueChartProps) {
  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      displayAmount: item.amount / 100, // Convert cents to dollars
    }));
  }, [data]);

  const ChartComponent = variant === 'line' ? LineChart : AreaChart;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload.date}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Revenue: <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
          </p>
          {showCount && (
            <p className="text-sm text-gray-600">
              Transactions: <span className="font-semibold">{payload[0].payload.count}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {variant === 'line' ? (
            <Line
              type="monotone"
              dataKey="displayAmount"
              name="Revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          ) : (
            <Area
              type="monotone"
              dataKey="displayAmount"
              name="Revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.2}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {formattedData.length === 0 && (
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-gray-500">No revenue data available for this period</p>
        </div>
      )}
    </Card>
  );
}
