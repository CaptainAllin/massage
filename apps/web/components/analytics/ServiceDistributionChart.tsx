'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '@massage/ui';
import { formatCurrency as fmtCurrency } from '@/lib/format';

export interface ServiceData {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface ServiceDistributionChartProps {
  services: ServiceData[];
  title?: string;
  metric?: 'revenue' | 'count';
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
  '#f97316',
  '#14b8a6',
];

export function ServiceDistributionChart({
  services,
  title = 'Service Distribution',
  metric = 'revenue',
  currency = 'AUD',
}: ServiceDistributionChartProps) {
  const chartData = useMemo(() => {
    return services.map((service) => ({
      ...service,
      value: metric === 'revenue' ? service.revenue / 100 : service.count,
      displayRevenue: service.revenue / 100,
    }));
  }, [services, metric]);

  const formatCurrency = (value: number) =>
    fmtCurrency(value, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const service = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{service.name}</p>
          <p className="mt-1 text-sm text-gray-600">
            Revenue: <span className="font-semibold">{formatCurrency(service.displayRevenue)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Appointments: <span className="font-semibold">{service.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Share: <span className="font-semibold">{service.percentage.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(_value, entry: any) => (
                  <span className="text-sm text-gray-700">{entry.payload.name}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-2 border-t pt-4">
            {chartData.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-gray-700">{service.name}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-600">{service.count} sessions</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(service.displayRevenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-gray-500">No service data available for this period</p>
        </div>
      )}
    </Card>
  );
}
