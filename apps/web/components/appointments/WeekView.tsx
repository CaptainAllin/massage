import { AppointmentWithRelations } from '@massage/types';
import { AppointmentCard } from './AppointmentCard';
import { format, addDays, startOfWeek, isSameDay, setHours, setMinutes } from 'date-fns';
import { useMemo } from 'react';

interface WeekViewProps {
  currentDate: Date;
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeekView({
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
}: WeekViewProps) {
  // Get the start of the week (Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  // Generate array of dates for the week
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Group appointments by day and hour
  const appointmentsByDayAndHour = useMemo(() => {
    const grouped: Record<string, AppointmentWithRelations[]> = {};

    appointments.forEach((appointment) => {
      const startTime = new Date(appointment.startTime);
      const dayIndex = weekDates.findIndex((date) => isSameDay(date, startTime));

      if (dayIndex !== -1) {
        const hour = startTime.getHours();
        const key = `${dayIndex}-${hour}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(appointment);
      }
    });

    return grouped;
  }, [appointments, weekDates]);

  const getAppointmentsForSlot = (dayIndex: number, hour: number) => {
    return appointmentsByDayAndHour[`${dayIndex}-${hour}`] || [];
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
      {/* Horizontal scroll wrapper for small screens */}
      <div className="overflow-x-auto">
      <div style={{ minWidth: '560px' }}>
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-2 sm:p-4 bg-gray-50"></div>
        {weekDates.map((date, index) => {
          const isToday = isSameDay(date, new Date());
          return (
            <div
              key={index}
              className={`p-2 sm:p-4 text-center border-l border-gray-200 ${
                isToday ? 'bg-sage-50' : 'bg-gray-50'
              }`}
            >
              <div className="text-xs sm:text-sm font-semibold text-gray-900">
                {DAYS_OF_WEEK[index]}
              </div>
              <div
                className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 ${
                  isToday ? 'text-sage-600' : 'text-gray-700'
                }`}
              >
                {format(date, 'd')}
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">{format(date, 'MMM')}</div>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px] sm:min-h-[80px]">
            {/* Hour Label */}
            <div className="p-1 sm:p-2 text-xs font-medium text-gray-600 bg-gray-50 flex items-start justify-end pr-2 sm:pr-4">
              {format(setHours(new Date(), hour), 'h:mm a')}
            </div>

            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              const appointmentsInSlot = getAppointmentsForSlot(dayIndex, hour);
              const slotDateTime = setMinutes(setHours(date, hour), 0);

              return (
                <div
                  key={dayIndex}
                  className="p-2 border-l border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors relative"
                  onClick={() => onSlotClick(slotDateTime, hour)}
                >
                  {appointmentsInSlot.length > 0 ? (
                    <div className="space-y-1">
                      {appointmentsInSlot.map((appointment) => (
                        <div
                          key={appointment.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(appointment);
                          }}
                        >
                          <AppointmentCard appointment={appointment} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </div>
      </div>
    </div>
  );
}
