export interface HeatmapCell {
  slot: 'morning' | 'midday' | 'afternoon' | 'evening';
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  density: number;
}

export interface WeekBar {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  count: number;
  isToday: boolean;
}

export interface ServiceShare {
  name: string;
  pct: number;
}

export interface DashboardAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceType: string | null;
  client: { id: string; firstName: string; lastName: string } | null;
  therapist: { id: string; user: { firstName: string | null; lastName: string | null } } | null;
}

export interface BentoDashboardData {
  isLoading: boolean;
  error: unknown;
  // existing
  todayAppointments: DashboardAppointment[];
  clientCount: number;
  revenue: { totalRevenue: number; revenueGrowth: number };
  serviceMix: Array<{ serviceType: string; count: number }>;
  // bento fields
  collectedToday: number;
  avgPerVisit: number;
  newClientsThisWeek: number;
  rebookedRate: number;
  noShowsThisWeek: number;
  dueBack: number;
  weekBars: WeekBar[];
  busiestHeatmap: HeatmapCell[];
  topServices: ServiceShare[];
  capacityBooked: number;
  capacityTotal: number;
}
