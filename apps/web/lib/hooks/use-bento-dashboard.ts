'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { BentoDashboardData, WeekBar, HeatmapCell, ServiceShare, DashboardAppointment } from '@/lib/types/dashboard';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const SLOT_NAMES = ['morning', 'midday', 'afternoon', 'evening'] as const;

function fillWeekBars(bars: WeekBar[] | undefined): WeekBar[] {
  if (bars && bars.length === 7) return bars;
  const todayDow = (new Date().getDay() + 6) % 7;
  return DAY_NAMES.map((day, i) => {
    const existing = bars?.find((b) => b.day === day);
    return existing ?? { day, count: 0, isToday: i === todayDow };
  });
}

function fillHeatmap(cells: HeatmapCell[] | undefined): HeatmapCell[] {
  const full: HeatmapCell[] = [];
  for (const slot of SLOT_NAMES) {
    for (let day = 0; day < 7; day++) {
      const existing = cells?.find((c) => c.slot === slot && c.day === day);
      full.push(existing ?? { slot, day: day as HeatmapCell['day'], density: 0 });
    }
  }
  return full;
}

export function useBentoDashboard(businessId: string | undefined): BentoDashboardData {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bentoDashboard', businessId],
    queryFn: async () => {
      const r = await apiClient.get('/dashboard', { params: { businessId } });
      return r.data.data as Record<string, unknown>;
    },
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000,
  });

  const todayAppointments = (data?.todayAppointments as DashboardAppointment[]) ?? [];
  const clientCount = (data?.clientCount as number) ?? 0;
  const revenue = (data?.revenue as { totalRevenue: number; revenueGrowth: number }) ?? {
    totalRevenue: 0,
    revenueGrowth: 0,
  };
  const serviceMix =
    (data?.serviceMix as Array<{ serviceType: string; count: number }>) ?? [];

  const collectedToday = (data?.collectedToday as number) ?? 0;
  const avgPerVisit = (data?.avgPerVisit as number) ?? 0;
  const newClientsThisWeek = (data?.newClientsThisWeek as number) ?? 0;
  const rebookedRate = Math.min(100, Math.max(0, (data?.rebookedRate as number) ?? 0));
  const noShowsThisWeek = (data?.noShowsThisWeek as number) ?? 0;
  const dueBack = (data?.dueBack as number) ?? 0;
  const capacityTotal = Math.max(0, (data?.capacityTotal as number) ?? 8);
  const capacityBooked = Math.min(capacityTotal, Math.max(0, (data?.capacityBooked as number) ?? 0));

  const weekBars = fillWeekBars(data?.weekBars as WeekBar[] | undefined);
  const busiestHeatmap = fillHeatmap(data?.busiestHeatmap as HeatmapCell[] | undefined);

  const rawTopServices = (data?.topServices as ServiceShare[]) ?? [];
  const topServices: ServiceShare[] = rawTopServices.map((s) => ({
    name: s.name,
    pct: Math.min(100, Math.max(0, s.pct)),
  }));

  return {
    isLoading,
    error,
    todayAppointments,
    clientCount,
    revenue,
    serviceMix,
    collectedToday,
    avgPerVisit,
    newClientsThisWeek,
    rebookedRate,
    noShowsThisWeek,
    dueBack,
    weekBars,
    busiestHeatmap,
    topServices,
    capacityBooked,
    capacityTotal,
  };
}
