'use client';

import { useState, useMemo } from 'react';
import { AppointmentStatus, AppointmentWithRelations, Therapist } from '@massage/types';
import { CalendarFilters } from './CalendarFilters';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { StaffView } from './StaffView';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useLocations } from '@/lib/hooks/use-locations';
import { startOfWeek, endOfWeek, startOfDay, endOfDay, startOfMonth, endOfMonth, getWeek, format } from 'date-fns';
import { EmptyState } from '@massage/ui';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { MapPin } from 'lucide-react';

interface AppointmentCalendarProps {
  businessId: string | undefined;
  therapists: Therapist[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: Date, therapistId?: string) => void;
}

function formatRevenue(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${amount.toLocaleString()}`;
}

function getWeekNumber(d: Date): number {
  return getWeek(d, { weekStartsOn: 0 });
}

export function AppointmentCalendar({
  businessId,
  therapists,
  onAppointmentClick,
  onSlotClick,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month' | 'staff'>('week');
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
  ]);
  const { data: locations = [] } = useLocations(businessId);

  const dateRange = useMemo(() => {
    if (viewMode === 'day' || viewMode === 'staff') {
      return { startDate: startOfDay(currentDate), endDate: endOfDay(currentDate) };
    }
    if (viewMode === 'month') {
      return { startDate: startOfMonth(currentDate), endDate: endOfMonth(currentDate) };
    }
    return {
      startDate: startOfWeek(currentDate, { weekStartsOn: 0 }),
      endDate: endOfWeek(currentDate, { weekStartsOn: 0 }),
    };
  }, [currentDate, viewMode]);

  const { data: appointmentsResponse, isLoading } = useAppointments(businessId, {
    therapistId: viewMode === 'staff' ? undefined : (selectedTherapist || undefined),
    status: selectedStatuses,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
  } as any);

  const appointments = appointmentsResponse?.data || [];

  // Summary stats
  const sessionCount = appointments.length;
  const therapistCount = new Set(appointments.map((a) => a.therapistId)).size;
  const totalRevenue = appointments.reduce((sum, a) => sum + (a.price ?? 0), 0);

  const weekNum = getWeekNumber(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const dateRangeLabel =
    viewMode === 'day' || viewMode === 'staff'
      ? format(currentDate, 'EEEE, d MMMM yyyy')
      : viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy')
      : `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`;

  const handleSlotClick = (date: Date, _hour: number) => {
    onSlotClick(date, selectedTherapist || undefined);
  };

  const handleStaffSlotClick = (date: Date, therapistId: string) => {
    onSlotClick(date, therapistId);
  };

  const queryClient = useQueryClient();

  const handleAppointmentDrop = async (appointmentId: string, newStartTime: Date) => {
    try {
      await apiClient.patch(`/appointments/${appointmentId}?businessId=${businessId}`, {
        businessId,
        startTime: newStartTime.toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments', businessId] });
    } catch {
      // silently ignore — the calendar will not update if the slot was unavailable
    }
  };

  const calendarContent = isLoading ? (
    <div
      className="rounded-2xl p-10"
      style={{ background: '#fff', border: '1px solid #EFE9F2' }}
    >
      <div className="animate-pulse space-y-3">
        <div className="h-4 rounded-full" style={{ background: '#EDE5F4', width: '30%' }} />
        <div className="h-48 rounded-xl" style={{ background: '#EDE5F4' }} />
      </div>
    </div>
  ) : viewMode === 'staff' ? (
    <StaffView
      currentDate={currentDate}
      appointments={appointments}
      therapists={therapists}
      onAppointmentClick={onAppointmentClick}
      onSlotClick={handleStaffSlotClick}
    />
  ) : appointments.length === 0 ? (
    <div
      className="rounded-2xl p-12"
      style={{ background: '#fff', border: '1px solid #EFE9F2' }}
    >
      <EmptyState
        title="No appointments found"
        description="There are no appointments scheduled for this time period. Click on a time slot to create one."
      />
    </div>
  ) : viewMode === 'month' ? (
    <MonthView
      currentDate={currentDate}
      appointments={appointments}
      onAppointmentClick={onAppointmentClick}
      onSlotClick={handleSlotClick}
    />
  ) : viewMode === 'week' ? (
    <WeekView
      currentDate={currentDate}
      appointments={appointments}
      onAppointmentClick={onAppointmentClick}
      onSlotClick={handleSlotClick}
      onAppointmentDrop={handleAppointmentDrop}
    />
  ) : (
    <DayView
      currentDate={currentDate}
      appointments={appointments}
      onAppointmentClick={onAppointmentClick}
      onSlotClick={handleSlotClick}
      onAppointmentDrop={handleAppointmentDrop}
    />
  );

  return (
    <div className="space-y-4">
      {/* Iris calendar header: title + week range + stats */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}
          >
            Calendar
          </p>
          <h1
            className="text-2xl font-semibold font-display"
            style={{ color: '#1E1830', letterSpacing: '-0.4px' }}
          >
            {dateRangeLabel}
          </h1>
          {viewMode === 'week' && (
            <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
              Week {weekNum}
            </p>
          )}
        </div>

        {/* Summary stats */}
        {!isLoading && sessionCount > 0 && (
          <p className="text-sm font-medium" style={{ color: '#7A7090' }}>
            <span style={{ color: '#1E1830' }}>{sessionCount}</span>
            {' session' + (sessionCount !== 1 ? 's' : '')}
            {therapistCount > 0 && (
              <>
                {' · '}
                <span style={{ color: '#1E1830' }}>{therapistCount}</span>
                {' therapist' + (therapistCount !== 1 ? 's' : '')}
              </>
            )}
            {totalRevenue > 0 && (
              <>
                {' · '}
                <span style={{ color: '#1E1830' }}>{formatRevenue(totalRevenue)}</span>
                {' booked'}
              </>
            )}
          </p>
        )}
      </div>

      {(locations as any[]).length > 1 && (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: '#9E96B0' }} />
          <select
            value={selectedLocationId ?? ''}
            onChange={(e) => setSelectedLocationId(e.target.value || null)}
            className="text-sm rounded-lg px-2.5 py-1.5 focus:outline-none"
            style={{ border: '1px solid #D9D3E8', color: '#3D3450', background: '#fff' }}
          >
            <option value="">All locations</option>
            {(locations as any[]).map((loc: any) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      )}

      <CalendarFilters
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        selectedTherapist={selectedTherapist}
        onTherapistChange={setSelectedTherapist}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        therapists={therapists}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {calendarContent}
    </div>
  );
}
