'use client';

import React, { useState } from 'react';
import { KPICard } from '../../../components/analytics/KPICard';
import { useDashboardOverview } from '../../../lib/hooks/useAnalytics';

export default function AnalyticsPage() {
  // Default to last 30 days
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: overview, isLoading, error } = useDashboardOverview(dateRange);

  const handleDateRangeChange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    const endDate = new Date();
    let startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'quarter':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'year':
        startDate.setDate(endDate.getDate() - 365);
        break;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error loading analytics data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of your business performance
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleDateRangeChange('week')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('month')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('quarter')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Last 90 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('year')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Last Year
          </button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-xs text-gray-500 flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Auto-refreshing every 5 minutes</span>
      </div>

      {/* Revenue KPIs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={overview?.revenue.totalRevenue ?? 0}
            format="currency"
            trend={{
              value: overview?.revenue.revenueGrowth ?? 0,
              label: 'vs previous period',
            }}
            isLoading={isLoading}
          />
          <KPICard
            title="Average Transaction"
            value={overview?.revenue.averageTransactionValue ?? 0}
            format="currency"
            isLoading={isLoading}
          />
          <KPICard
            title="Transactions"
            value={overview?.revenue.transactionCount ?? 0}
            format="number"
            isLoading={isLoading}
          />
          <KPICard
            title="Outstanding"
            value={overview?.revenue.outstandingAmount ?? 0}
            format="currency"
            subtitle="Unpaid invoices"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Client KPIs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Active Clients"
            value={overview?.clients.totalActiveClients ?? 0}
            format="number"
            isLoading={isLoading}
          />
          <KPICard
            title="New Clients"
            value={overview?.clients.newClients ?? 0}
            format="number"
            trend={{
              value: overview?.clients.newClientsGrowth ?? 0,
              label: 'vs previous period',
            }}
            isLoading={isLoading}
          />
          <KPICard
            title="Returning Rate"
            value={overview?.clients.returningClientRate ?? 0}
            format="percentage"
            subtitle="Client retention"
            isLoading={isLoading}
          />
          <KPICard
            title="Lifetime Value"
            value={overview?.clients.clientLifetimeValue ?? 0}
            format="currency"
            subtitle="Average per client"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Appointment KPIs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Appointments"
            value={overview?.appointments.totalAppointments ?? 0}
            format="number"
            trend={{
              value: overview?.appointments.appointmentsGrowth ?? 0,
              label: 'vs previous period',
            }}
            isLoading={isLoading}
          />
          <KPICard
            title="Completion Rate"
            value={overview?.appointments.completionRate ?? 0}
            format="percentage"
            isLoading={isLoading}
          />
          <KPICard
            title="Cancellation Rate"
            value={overview?.appointments.cancellationRate ?? 0}
            format="percentage"
            isLoading={isLoading}
          />
          <KPICard
            title="No-Show Rate"
            value={overview?.appointments.noShowRate ?? 0}
            format="percentage"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Therapist KPIs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Therapist Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Active Therapists"
            value={overview?.therapists.activeTherapists ?? 0}
            format="number"
            isLoading={isLoading}
          />
          <KPICard
            title="Avg Sessions"
            value={overview?.therapists.averageSessionsPerTherapist ?? 0}
            format="number"
            subtitle="Per therapist"
            isLoading={isLoading}
          />
          <KPICard
            title="Top Performer"
            value={overview?.therapists.topPerformer ?? 'N/A'}
            subtitle={
              overview?.therapists.topPerformerRevenue
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(overview.therapists.topPerformerRevenue)
                : undefined
            }
            isLoading={isLoading}
          />
          <KPICard
            title="Utilization Rate"
            value={overview?.therapists.utilizationRate ?? 0}
            format="percentage"
            subtitle="Overall efficiency"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
