import { AppointmentStatus, AppointmentWithRelations } from '@massage/types';
import { AppointmentCard } from './AppointmentCard';
import { format, addDays, startOfWeek, isSameDay, setHours, setMinutes } from 'date-fns';
import { useMemo, useEffect, useRef, useState } from 'react';

interface WeekViewProps {
  currentDate: Date;
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onAppointmentDrop?: (appointmentId: string, newStartTime: Date) => void;
  therapistColorMap?: Map<string, string>;
}

const DRAGGABLE_STATUSES = new Set([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]);

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm
const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const ROW_HEIGHT = 46; // px per hour — must match time gutter cell height

export function WeekView({
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
  onAppointmentDrop,
  therapistColorMap,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const draggingRef = useRef<{ id: string; originalStart: Date } | null>(null);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

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

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 7 * 60;
  const nowTopPx = ((nowMinutes - startMinutes) / 60) * ROW_HEIGHT;
  const showNowLine = nowMinutes >= startMinutes && nowMinutes <= (7 + 14) * 60;
  const todayColIndex = weekDates.findIndex((d) => isSameDay(d, now));

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        '--ink': '#1E1830',
        '--muted': '#7E748F',
        '--primary': '#5D4AA8',
        '--line2': '#F1EEF6',
        '--surface': '#FFFFFF',
        background: 'var(--surface)',
        border: '1px solid var(--line2)',
        boxShadow: '0 2px 12px rgba(93,74,168,0.06)',
      } as React.CSSProperties}
    >
      <div className="overflow-x-auto">
        <div
          ref={scrollRef}
          style={{ minWidth: '600px', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}
        >
          {/* Sticky header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '48px repeat(7, 1fr)',
            borderBottom: '1px solid var(--line2)',
            position: 'sticky',
            top: 0,
            background: 'var(--surface)',
            zIndex: 1,
          }}>
            <div />{/* empty corner above time gutter */}
            {weekDates.map((date, i) => {
              const isToday = isSameDay(date, new Date());
              return (
                <div key={i} style={{
                  padding: '10px 8px',
                  borderLeft: '1px solid var(--line2)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 9.5,
                    color: 'var(--muted)',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}>
                    {DAYS_OF_WEEK[i]}
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: isToday ? '#fff' : 'var(--ink)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: isToday ? 'var(--primary)' : 'transparent',
                  }}>
                    {format(date, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid body with now-line */}
          <div style={{ position: 'relative' }}>
            {showNowLine && todayColIndex >= 0 && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                style={{ top: `${nowTopPx}px` }}
              >
                <div style={{
                  position: 'absolute',
                  left: `calc(48px + ${todayColIndex} * ((100% - 48px) / 7))`,
                  width: `calc((100% - 48px) / 7)`,
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#5D4AA8', flexShrink: 0, marginLeft: -4,
                  }} />
                  <div style={{
                    flex: 1, height: 1.5,
                    background: '#5D4AA8',
                    boxShadow: '0 0 8px rgba(93,74,168,0.55)',
                  }} />
                </div>
              </div>
            )}

            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px repeat(7, 1fr)',
                  borderBottom: '1px solid var(--line2)',
                  minHeight: `${ROW_HEIGHT}px`,
                }}
              >
                {/* Time gutter label */}
                <div style={{
                  height: ROW_HEIGHT,
                  fontSize: 10,
                  color: 'var(--muted)',
                  paddingTop: 3,
                  textAlign: 'right',
                  paddingRight: 7,
                }}>
                  {hour <= 12 ? hour : hour - 12}{hour < 12 ? 'a' : 'p'}
                </div>

                {weekDates.map((date, dayIndex) => {
                  const appts = getAppointmentsForSlot(dayIndex, hour);
                  const slotDateTime = setMinutes(setHours(date, hour), 0);
                  const isTodayCol = isSameDay(date, now);
                  const slotKey = `${dayIndex}-${hour}`;
                  const isDragOver = dragOverKey === slotKey;

                  return (
                    <div
                      key={dayIndex}
                      className="p-1 cursor-pointer"
                      style={{
                        borderLeft: '1px solid var(--line2)',
                        background: isDragOver ? '#EDE5F4' : isTodayCol ? '#FDFBFF' : 'transparent',
                        outline: isDragOver ? '2px solid var(--primary)' : 'none',
                        outlineOffset: '-2px',
                        borderRadius: isDragOver ? 4 : undefined,
                        transition: 'background 0.1s, outline 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!appts.length && !draggingRef.current)
                          e.currentTarget.style.background = '#F5F0FA';
                      }}
                      onMouseLeave={(e) => {
                        if (!draggingRef.current)
                          e.currentTarget.style.background = isTodayCol ? '#FDFBFF' : 'transparent';
                      }}
                      onClick={() => onSlotClick(slotDateTime, hour)}
                      onDragOver={(e) => {
                        if (!onAppointmentDrop) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverKey(slotKey);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        setDragOverKey(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverKey(null);
                        if (!onAppointmentDrop || !draggingRef.current) return;
                        const { id, originalStart } = draggingRef.current;
                        const newStart = setMinutes(setHours(date, hour), originalStart.getMinutes());
                        if (
                          isSameDay(newStart, originalStart) &&
                          newStart.getHours() === originalStart.getHours()
                        ) return;
                        onAppointmentDrop(id, newStart);
                      }}
                    >
                      {appts.length > 0 && (
                        <div className="space-y-1">
                          {appts.map((appt) => {
                            const canDrag = DRAGGABLE_STATUSES.has(appt.status);
                            return (
                              <div
                                key={appt.id}
                                draggable={canDrag}
                                style={{ cursor: canDrag ? 'grab' : 'default' }}
                                onDragStart={(e) => {
                                  if (!canDrag) { e.preventDefault(); return; }
                                  draggingRef.current = { id: appt.id, originalStart: new Date(appt.startTime) };
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.dataTransfer.setData('text/plain', appt.id);
                                }}
                                onDragEnd={() => {
                                  draggingRef.current = null;
                                  setDragOverKey(null);
                                }}
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
                            );
                          })}
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
