import { AppointmentWithRelations } from '@massage/types';
import { AppointmentCard } from './AppointmentCard';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  setHours,
  setMinutes,
} from 'date-fns';
import { useMemo } from 'react';

interface MonthViewProps {
  currentDate: Date;
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: Date, hour: number) => void;
  therapistColorMap?: Map<string, string>;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_HOUR = 9;

export function MonthView({
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
  therapistColorMap,
}: MonthViewProps) {
  const today = new Date();

  // Build the grid: weeks covering the full month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = gridStart;
    while (day <= gridEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, AppointmentWithRelations[]> = {};
    appointments.forEach((appt) => {
      const key = format(new Date(appt.startTime), 'yyyy-MM-dd');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(appt);
    });
    return grouped;
  }, [appointments]);

  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(calendarDays.slice(i, i + 7));
    }
    return rows;
  }, [calendarDays]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      {/* Day-of-week header */}
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid #EFE9F2' }}>
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wide"
            style={{ background: '#FBF8FD', color: '#7A7090', letterSpacing: '0.8px' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => (
        <div
          key={wi}
          className="grid grid-cols-7"
          style={{ borderBottom: wi < weeks.length - 1 ? '1px solid #EFE9F2' : undefined }}
        >
          {week.map((date, di) => {
            const key = format(date, 'yyyy-MM-dd');
            const dayAppts = appointmentsByDay[key] || [];
            const isToday = isSameDay(date, today);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const slotDateTime = setMinutes(setHours(date, DEFAULT_HOUR), 0);

            return (
              <div
                key={di}
                className="min-h-[110px] p-1.5 cursor-pointer transition-colors"
                style={{
                  borderLeft: di > 0 ? '1px solid #EFE9F2' : undefined,
                  background: isToday ? '#FDFBFF' : 'transparent',
                  opacity: isCurrentMonth ? 1 : 0.4,
                }}
                onMouseEnter={(e) => {
                  if (!isToday) e.currentTarget.style.background = '#F5F0FA';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isToday ? '#FDFBFF' : 'transparent';
                }}
                onClick={() => onSlotClick(slotDateTime, DEFAULT_HOUR)}
              >
                {/* Day number */}
                <div className="flex items-center justify-center mb-1" style={{ height: '28px' }}>
                  {isToday ? (
                    <span
                      className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
                    >
                      {format(date, 'd')}
                    </span>
                  ) : (
                    <span
                      className="text-xs font-medium"
                      style={{ color: isCurrentMonth ? '#3D3450' : '#A89EC0' }}
                    >
                      {format(date, 'd')}
                    </span>
                  )}
                </div>

                {/* Appointments — show up to 3, then overflow count */}
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map((appt) => (
                    <div
                      key={appt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appt);
                      }}
                    >
                      <AppointmentCard
                        appointment={appt}
                        therapistColor={therapistColorMap?.get(appt.therapistId ?? '')}
                      />
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <p
                      className="text-xs font-medium px-1"
                      style={{ color: '#5D4AA8' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      +{dayAppts.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
