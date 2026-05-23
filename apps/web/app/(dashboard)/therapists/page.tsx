'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Table, type Column } from '@massage/ui';
import { TrendingUp, TrendingDown, Users, Award, Activity, RefreshCw, X, ChevronDown } from 'lucide-react';
import { TherapistComparisonChart, type TherapistPerformanceData } from '@/components/analytics/TherapistComparisonChart';
import { KPICard } from '@/components/analytics/KPICard';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useTherapistPerformance, type TherapistPerformanceRecord } from '@/lib/hooks/use-therapists';

type DatePreset = 'week' | 'month' | 'quarter' | 'year';
type SortKey = keyof TherapistPerformanceRecord;
type MetricToggle = 'revenue' | 'sessions';

function makeDateRange(preset: DatePreset) {
  const end = new Date();
  const start = new Date();
  const offsets: Record<DatePreset, number> = { week: 7, month: 30, quarter: 90, year: 365 };
  start.setDate(end.getDate() - offsets[preset]);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getRateBadge(rate: number) {
  if (rate >= 70) return <Badge variant="success">{rate.toFixed(1)}%</Badge>;
  if (rate >= 40) return <Badge variant="warning">{rate.toFixed(1)}%</Badge>;
  return <Badge variant="danger">{rate.toFixed(1)}%</Badge>;
}

const PRESET_LABELS: Record<DatePreset, string> = {
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  quarter: 'Last 90 Days',
  year: 'Last Year',
};

interface DetailPanelProps {
  therapist: TherapistPerformanceRecord;
  teamAvg: {
    sessionsCompleted: number;
    revenueGenerated: number;
    utilizationRate: number;
    rebookingRate: number;
  };
  onClose: () => void;
}

function TherapistDetailPanel({ therapist, teamAvg, onClose }: DetailPanelProps) {
  const [detailPreset, setDetailPreset] = useState<DatePreset>('month');
  const businessId = useBusinessId();
  const dateRange = makeDateRange(detailPreset);

  const { data, isLoading } = useTherapistPerformance(businessId, {
    ...dateRange,
    therapistId: therapist.therapistId,
  });

  const detail = data?.therapists?.[0] ?? therapist;

  const metrics = [
    {
      label: 'Sessions Completed',
      value: detail.sessionsCompleted,
      avg: teamAvg.sessionsCompleted,
      format: 'number' as const,
    },
    {
      label: 'Revenue Generated',
      value: detail.revenueGenerated,
      avg: teamAvg.revenueGenerated,
      format: 'currency' as const,
    },
    {
      label: 'Utilization Rate',
      value: detail.utilizationRate,
      avg: teamAvg.utilizationRate,
      format: 'percentage' as const,
    },
    {
      label: 'Rebooking Rate',
      value: detail.rebookingRate,
      avg: teamAvg.rebookingRate,
      format: 'percentage' as const,
    },
  ];

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold text-sm border border-blue-200">
              {therapist.therapistName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <CardTitle className="text-base">{therapist.therapistName}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Individual performance breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {(Object.keys(PRESET_LABELS) as DatePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDetailPreset(preset)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    detailPreset === preset
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {PRESET_LABELS[preset]}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map(({ label, value, avg, format }) => {
              const diff = avg > 0 ? ((value - avg) / avg) * 100 : 0;
              const formatted =
                format === 'currency'
                  ? formatCurrency(value)
                  : format === 'percentage'
                    ? `${value.toFixed(1)}%`
                    : value.toString();
              const avgFormatted =
                format === 'currency'
                  ? formatCurrency(avg)
                  : format === 'percentage'
                    ? `${avg.toFixed(1)}%`
                    : avg.toFixed(1);
              return (
                <div key={label} className="rounded-lg bg-white border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{formatted}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {diff >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}% vs team avg
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Team avg: {avgFormatted}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TherapistsPage() {
  const businessId = useBusinessId();
  const [preset, setPreset] = useState<DatePreset>('month');
  const [metric, setMetric] = useState<MetricToggle>('revenue');
  const [sortKey, setSortKey] = useState<SortKey>('revenueGenerated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dateRange = makeDateRange(preset);
  const { data, isLoading, error, refetch } = useTherapistPerformance(businessId, dateRange);

  const therapists = data?.therapists ?? [];

  const kpis = useMemo(() => {
    if (!therapists.length) return null;
    const totalSessions = therapists.reduce((s, t) => s + t.sessionsCompleted, 0);
    const totalRevenue = therapists.reduce((s, t) => s + t.revenueGenerated, 0);
    const top = [...therapists].sort((a, b) => b.revenueGenerated - a.revenueGenerated)[0];
    const avgUtil = therapists.reduce((s, t) => s + t.utilizationRate, 0) / therapists.length;
    return {
      activeTherapists: therapists.length,
      avgSessionsPerTherapist: Math.round((totalSessions / therapists.length) * 10) / 10,
      topPerformer: top.therapistName,
      topPerformerRevenue: top.revenueGenerated,
      utilizationRate: Math.round(avgUtil * 10) / 10,
      teamAvg: {
        sessionsCompleted: totalSessions / therapists.length,
        revenueGenerated: totalRevenue / therapists.length,
        utilizationRate: avgUtil,
        rebookingRate: therapists.reduce((s, t) => s + t.rebookingRate, 0) / therapists.length,
      },
    };
  }, [therapists]);

  const chartData = useMemo<TherapistPerformanceData[]>(
    () =>
      therapists.map((t) => ({
        id: t.therapistId,
        name: t.therapistName,
        revenue: t.revenueGenerated,
        sessions: t.sessionsCompleted,
        completionRate: t.utilizationRate,
      })),
    [therapists],
  );

  const sorted = useMemo(() => {
    return [...therapists].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortOrder === 'asc' ? av - bv : bv - av;
    });
  }, [therapists, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key as SortKey);
      setSortOrder('desc');
    }
  };

  const selectedTherapist = selectedId ? therapists.find((t) => t.therapistId === selectedId) : null;

  const columns: Column<TherapistPerformanceRecord>[] = [
    {
      key: 'therapistName',
      header: 'Therapist',
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-800 text-xs font-semibold border border-green-200 shrink-0">
            {t.therapistName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span className="font-medium">{t.therapistName}</span>
        </div>
      ),
    },
    {
      key: 'sessionsCompleted',
      header: 'Sessions',
      sortable: true,
      render: (t) => <span className="font-semibold">{t.sessionsCompleted}</span>,
    },
    {
      key: 'revenueGenerated',
      header: 'Revenue',
      sortable: true,
      render: (t) => <span className="font-semibold">{formatCurrency(t.revenueGenerated)}</span>,
    },
    {
      key: 'utilizationRate',
      header: 'Utilization',
      sortable: true,
      render: (t) => getRateBadge(t.utilizationRate),
    },
    {
      key: 'rebookingRate',
      header: 'Rebooking',
      sortable: true,
      render: (t) => getRateBadge(t.rebookingRate),
    },
    {
      key: 'therapistId',
      header: '',
      render: (t) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId((cur) => (cur === t.therapistId ? null : t.therapistId));
          }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {selectedId === t.therapistId ? 'Hide detail' : 'View detail'}
          <ChevronDown
            className={`h-3 w-3 transition-transform ${selectedId === t.therapistId ? 'rotate-180' : ''}`}
          />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Therapist Performance</h1>
          <p className="text-muted-foreground mt-1">Track sessions, revenue, utilization and rebooking by therapist</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(PRESET_LABELS) as DatePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                preset === p
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          Failed to load performance data. Please try again.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Therapists"
          value={kpis?.activeTherapists ?? 0}
          format="number"
          icon={<Users className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Avg Sessions"
          value={kpis?.avgSessionsPerTherapist ?? 0}
          format="number"
          subtitle="Per therapist"
          icon={<Activity className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Top Performer"
          value={kpis?.topPerformer ?? 'N/A'}
          subtitle={kpis?.topPerformerRevenue ? formatCurrency(kpis.topPerformerRevenue) : undefined}
          icon={<Award className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Avg Utilization"
          value={kpis?.utilizationRate ?? 0}
          format="percentage"
          subtitle="Team average"
          isLoading={isLoading}
        />
      </div>

      {/* Comparison Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Team Comparison</h2>
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                metric === 'revenue' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setMetric('sessions')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                metric === 'sessions' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sessions
            </button>
          </div>
        </div>

        {isLoading ? (
          <Card className="p-6">
            <div className="h-[400px] animate-pulse bg-gray-100 rounded-lg" />
          </Card>
        ) : (
          <TherapistComparisonChart
            data={chartData}
            metric={metric}
            title={metric === 'revenue' ? 'Revenue by Therapist' : 'Sessions by Therapist'}
          />
        )}
      </div>

      {/* Performance Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Therapists</h2>

        {isLoading ? (
          <Card className="p-6">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 h-8 bg-gray-200 rounded" />
                  <div className="w-20 h-8 bg-gray-200 rounded" />
                  <div className="w-24 h-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Table
            data={sorted}
            columns={columns}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onRowClick={(t) => setSelectedId((cur) => (cur === t.therapistId ? null : t.therapistId))}
            emptyMessage="No therapist data for this period"
          />
        )}
      </div>

      {/* Individual Therapist Detail Panel */}
      {selectedTherapist && kpis && (
        <TherapistDetailPanel
          therapist={selectedTherapist}
          teamAvg={kpis.teamAvg}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
