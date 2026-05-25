import { AppointmentWithRelations } from '@massage/types';
import { AppointmentCard } from './AppointmentCard';
import { format, addDays, startOfWeek, isSameDay, setHours, setMinutes } from 'date-fns';
import { useMemo, useEffect, useRef } from 'react';

interface WeekViewProps {
  currentDate: Date;
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ROW_HEIGHT = 56; // px per hour

export function WeekView({
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const hourOffset = Math.max(0, now.getHours() - 7 - 1);
      scrollRef.current.scrollTop = hourOffset * ROW_HEIGHT;
    }
  }, []);

  const appointmentsByDayAndHour = useMemo(() => {
    const grouped: Record<string, AppointmentWithRelations[]> = {};
    appointments.forEach((appointment) => {
      const startTime = new Date(appointment.startTime);
      const dayIndex = weekDates.findIndex((date) => isSameDay(date, startTime));
      if (dayIndex !== -1) {
        const hour = startTime.getHours();
        const key = `${dayIndex}-${hour}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(appointment);
      }
    });
    return grouped;
  }, [appointments, weekDates]);

  const getAppointmentsForSlot = (dayIndex: number, hour: number) =>
    appointmentsByDayAndHour[`${dayIndex}-${hour}`] || [];

  // Calculate now-line position
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 7 * 60;
  const nowTopPx = ((nowMinutes - startMinutes) / 60) * ROW_HEIGHT;
  const showNowLine = nowMinutes >= startMinutes && nowMinutes <= (7 + 14) * 60;
  const todayColIndex = weekDates.findIndex((d) => isSameDay(d, now));

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <div className="overflow-x-auto">
        <div style={{ minWidth: '600px' }}>
          {/* Week header */}
          <div className="grid grid-cols-8" style={{ borderBottom: '1px solid #EFE9F2' }}>
            <div className="py-3 px-2" style={{ background: '#FBF8FD' }} />
            {weekDates.map((date, index) => {
              const isToday = isSameDay(date, new Date());
              return (
                <div
                  key={index}
                  className="py-3 px-2 text-center"
                  style={{
                    background: isToday ? '#F1ECF5' : '#FBF8FD',
                    borderLeft: '1px solid #EFE9F2',
                  }}
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: isToday ? '#5D4AA8' : '#7A7090', letterSpacing: '0.8px' }}
                  >
                    {DAYS_OF_WEEK[index]}
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    {isToday ? (
                      <span
                        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
                      >
                        {format(date, 'd')}
                      </span>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: '#3D3450' }}>
                        {format(date, 'd')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5 hidden sm:block" style={{ color: '#7A7090' }}>
                    {format(date, 'MMM')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid with now-line */}
          <div
            ref={scrollRef}
            className="overflow-y-auto relative"
            style={{ maxHeight: 'calc(100vh - 320px)' }}
          >
            {/* Now-line overlay */}
            {showNowLine && todayColIndex >= 0 && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                style={{ top: `${nowTopPx}px` }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(12.5% + ${(todayColIndex / 7) * 87.5}%)`,
                    width: `${(1 / 7) * 87.5}%`,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {/* Dot on the left */}
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#5D4AA8',
                      flexShrink: 0,
                      marginLeft: '-4px',
                    }}
                  />
                  {/* Line */}
                  <div
                    style={{
                      flex: 1,
                      height: '1.5px',
                      background: '#5D4AA8',
                      boxShadow: '0 0 8px rgba(93,74,168,0.55)',
                    }}
                  />
                </div>
              </div>
            )}

            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8"
                style={{ borderBottom: '1px solid #EFE9F2', minHeight: `${ROW_HEIGHT}px` }}
              >
                {/* Hour label */}
                <div
                  className="px-2 py-1 text-xs flex items-start justify-end pt-1.5"
                  style={{ background: '#FBF8FD', color: '#7A7090', fontVariantNumeric: 'tabular-nums' }}
                >
                  {format(setHours(new Date(), hour), 'h a')}
                </div>

                {weekDates.map((date, dayIndex) => {
                  const appts = getAppointmentsForSlot(dayIndex, hour);
                  const slotDateTime = setMinutes(setHours(date, hour), 0);
                  const isTodayCol = isSameDay(date, now);

                  return (
                    <div
                      key={dayIndex}
                      className="p-1 cursor-pointer transition-colors"
                      style={{
                        borderLeft: '1px solid #EFE9F2',
                        background: isTodayCol ? '#FDFBFF' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!appts.length) e.currentTarget.style.background = '#F5F0FA';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isTodayCol ? '#FDFBFF' : 'transparent';
                      }}
                      onClick={() => onSlotClick(slotDateTime, hour)}
                    >
                      {appts.length > 0 && (
                        <div className="space-y-1">
                          {appts.map((appt) => (
                            <div
                              key={appt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAppointmentClick(appt);
                              }}
                            >
                              <AppointmentCard appointment={appt} />
                            </div>
                          ))}
                        </div>
                      )}
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
