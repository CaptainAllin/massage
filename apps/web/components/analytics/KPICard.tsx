import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@massage/ui';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
  format?: 'currency' | 'percentage' | 'number';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  isLoading = false,
  format = 'number',
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getTrendColor = (trendValue: number): string => {
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trendValue: number): string => {
    if (trendValue > 0) return '↑';
    if (trendValue < 0) return '↓';
    return '→';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              {title}
            </CardTitle>
            {icon && <div className="text-gray-400">{icon}</div>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </div>
          
          {subtitle && (
            <div className="text-sm text-gray-500">{subtitle}</div>
          )}
          
          {trend && (
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${getTrendColor(trend.value)}`}>
                {getTrendIcon(trend.value)} {Math.abs(trend.value).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
