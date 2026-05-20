'use client';

import { useState, useMemo } from 'react';
import { AppointmentStatus, AppointmentWithRelations, Therapist } from '@massage/types';
import { CalendarFilters } from './CalendarFilters';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { EmptyState } from '@massage/ui';

interface AppointmentCalendarProps {
  businessId: string;
  therapists: Therapist[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: Date, therapistId?: string) => void;
}

export function AppointmentCalendar({
  businessId,
  therapists,
  onAppointmentClick,
  onSlotClick,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.IN_PROGRESS,
  ]);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      return {
        startDate: startOfWeek(currentDate, { weekStartsOn: 0 }),
        endDate: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    } else {
      return {
        startDate: startOfDay(currentDate),
        endDate: endOfDay(currentDate),
      };
    }
  }, [currentDate, viewMode]);

  // Fetch appointments
  const { data: appointmentsResponse, isLoading } = useAppointments(businessId, {
    therapistId: selectedTherapist || undefined,
    status: selectedStatuses,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const appointments = appointmentsResponse?.data || [];

  const handleSlotClick = (date: Date, hour: number) => {
    onSlotClick(date, selectedTherapist || undefined);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
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
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-12">
          <EmptyState
            title="No appointments found"
            description="There are no appointments scheduled for this time period. Click on a time slot to create one."
          />
        </div>
      ) : viewMode === 'week' ? (
        <WeekView
          currentDate={currentDate}
          appointments={appointments}
          onAppointmentClick={onAppointmentClick}
          onSlotClick={handleSlotClick}
        />
      ) : (
        <DayView
          currentDate={currentDate}
          appointments={appointments}
          onAppointmentClick={onAppointmentClick}
          onSlotClick={handleSlotClick}
        />
      )}
    </div>
  );
}
