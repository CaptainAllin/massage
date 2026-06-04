'use client';

import React, { useState } from 'react';
import { KPICard } from '../../../components/analytics/KPICard';
import { useDashboardOverview } from '../../../lib/hooks/useAnalytics';
import { useLocations } from '../../../lib/hooks/use-locations';
import { useBusinessId } from '../../../lib/hooks/use-business-id';
import { useBusiness } from '../../../lib/hooks/use-business';
import { formatCurrency } from '../../../lib/format';
import { PermissionGuard } from '../../../components/PermissionGuard';

function AnalyticsPageInner() {
  const businessId = useBusinessId();
  // Default to last 30 days
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [locationId, setLocationId] = useState<string>('');

  const { data: business } = useBusiness(businessId);
  const currency = (business as any)?.currency || 'AUD';
  const { data: locations = [] } = useLocations(businessId);
  const { data: overview, isLoading, error } = useDashboardOverview({
    ...dateRange,
    ...(locationId ? { locationId } : {}),
  });

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
    <div className="space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Growth</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
            Overview of your business performance
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Location filter */}
          {locations.length > 0 && (
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Locations</option>
              {locations.map((loc: any) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}
          {/* Date Range Selector */}
          <button
            onClick={() => handleDateRangeChange('week')}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            7 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('month')}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            30 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('quarter')}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            90 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('year')}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Year
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
            currency={currency}
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
            currency={currency}
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
            currency={currency}
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
            currency={currency}
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
                ? formatCurrency(overview.therapists.topPerformerRevenue, currency)
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

export default function AnalyticsPage() {
  return (
    <PermissionGuard permission="analytics:view">
      <AnalyticsPageInner />
    </PermissionGuard>
  );
}
