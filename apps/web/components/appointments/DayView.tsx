import { AppointmentStatus, AppointmentWithRelations } from '@massage/types';
import { AppointmentCard } from './AppointmentCard';
import { format, setHours, setMinutes, isSameDay } from 'date-fns';
import { useMemo, useRef, useState } from 'react';

interface DayViewProps {
  currentDate: Date;
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onAppointmentDrop?: (appointmentId: string, newStartTime: Date) => void;
  therapistColorMap?: Map<string, string>;
}

const DRAGGABLE_STATUSES = new Set([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]);
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const ROW_HEIGHT = 56;

function formatRevenue(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `$${amount.toLocaleString()}`;
}

export function DayView({
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
  onAppointmentDrop,
  therapistColorMap,
}: DayViewProps) {
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const draggingRef = useRef<{ id: string; originalStart: Date } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const appointmentsByHour = useMemo(() => {
    const grouped: Record<number, AppointmentWithRelations[]> = {};
    appointments
      .filter((apt) => isSameDay(new Date(apt.startTime), currentDate))
      .forEach((appointment) => {
        const hour = new Date(appointment.startTime).getHours();
        if (!grouped[hour]) grouped[hour] = [];
        grouped[hour].push(appointment);
      });
    return grouped;
  }, [appointments, currentDate]);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [appointments]
  );

  const sessionCount = appointments.length;
  const therapistCount = new Set(appointments.map((a) => a.therapistId)).size;
  const totalRevenue = appointments.reduce((sum, a) => sum + (a.price ?? 0), 0);

  const isToday = isSameDay(currentDate, new Date());

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 7 * 60;
  const nowTopPx = ((nowMinutes - startMinutes) / 60) * ROW_HEIGHT;
  const showNowLine = isToday && nowMinutes >= startMinutes && nowMinutes <= (7 + 14) * 60;

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-start">
      {/* Time grid */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
      >
        {/* Day header */}
        <div
          className="p-5"
          style={{ background: isToday ? '#FDFBFF' : '#FBF8FD', borderBottom: '1px solid #EFE9F2' }}
        >
          <div className="text-center">
            <div
              className="text-xs font-semibold uppercase"
              style={{ color: '#7A7090', letterSpacing: '1.4px' }}
            >
              {format(currentDate, 'EEEE')}
            </div>
            <div className="text-4xl font-bold mt-1" style={{ color: isToday ? '#5D4AA8' : '#1E1830' }}>
              {format(currentDate, 'd')}
            </div>
            <div className="text-base mt-1" style={{ color: '#7A7090' }}>
              {format(currentDate, 'MMMM yyyy')}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div ref={scrollRef} className="overflow-y-auto relative" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          {showNowLine && (
            <div
              className="absolute left-0 right-0 pointer-events-none z-10"
              style={{ top: `${nowTopPx}px` }}
            >
              <div style={{ position: 'absolute', left: '120px', right: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5D4AA8', flexShrink: 0, marginLeft: '-4px' }} />
                <div style={{ flex: 1, height: '1.5px', background: '#5D4AA8', boxShadow: '0 0 8px rgba(93,74,168,0.55)' }} />
              </div>
            </div>
          )}

          {HOURS.map((hour) => {
            const appointmentsInHour = appointmentsByHour[hour] || [];
            const slotDateTime = setMinutes(setHours(currentDate, hour), 0);
            const isDragOver = dragOverHour === hour;

            return (
              <div
                key={hour}
                className="flex"
                style={{ borderBottom: '1px solid #EFE9F2', minHeight: `${ROW_HEIGHT}px` }}
              >
                <div
                  className="flex-shrink-0 px-3 py-2 text-xs flex items-start justify-end pt-2"
                  style={{
                    width: '120px',
                    background: '#FBF8FD',
                    color: '#7A7090',
                    fontVariantNumeric: 'tabular-nums',
                    borderRight: '1px solid #EFE9F2',
                  }}
                >
                  {format(setHours(new Date(), hour), 'h:mm a')}
                </div>

                <div
                  className="flex-1 p-2 cursor-pointer"
                  style={{
                    background: isDragOver ? '#EDE5F4' : undefined,
                    outline: isDragOver ? '2px solid #5D4AA8' : 'none',
                    outlineOffset: '-2px',
                  }}
                  onClick={() => onSlotClick(slotDateTime, hour)}
                  onMouseEnter={(e) => {
                    if (!appointmentsInHour.length && !draggingRef.current)
                      e.currentTarget.style.background = '#F5F0FA';
                  }}
                  onMouseLeave={(e) => {
                    if (!draggingRef.current) e.currentTarget.style.background = '';
                  }}
                  onDragOver={(e) => {
                    if (!onAppointmentDrop) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverHour(hour);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverHour(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverHour(null);
                    if (!onAppointmentDrop || !draggingRef.current) return;
                    const { id, originalStart } = draggingRef.current;
                    const newStart = setMinutes(setHours(currentDate, hour), originalStart.getMinutes());
                    if (newStart.getHours() === originalStart.getHours() && isSameDay(newStart, originalStart)) return;
                    onAppointmentDrop(id, newStart);
                  }}
                >
                  {appointmentsInHour.length > 0 ? (
                    <div className="space-y-1.5">
                      {appointmentsInHour.map((appointment) => {
                        const canDrag = DRAGGABLE_STATUSES.has(appointment.status);
                        return (
                          <div
                            key={appointment.id}
                            draggable={canDrag}
                            style={{ cursor: canDrag ? 'grab' : 'default' }}
                            onDragStart={(e) => {
                              if (!canDrag) { e.preventDefault(); return; }
                              draggingRef.current = { id: appointment.id, originalStart: new Date(appointment.startTime) };
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', appointment.id);
                            }}
                            onDragEnd={() => { draggingRef.current = null; setDragOverHour(null); }}
                            onClick={(e) => { e.stopPropagation(); onAppointmentClick(appointment); }}
                          >
                            <AppointmentCard
                              appointment={appointment}
                              therapistColor={therapistColorMap?.get(appointment.therapistId ?? '')}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs italic" style={{ color: '#A89EC0' }}>Click to schedule</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — lg+ only */}
      <div className="hidden lg:flex flex-col gap-3">
        {/* Stats */}
        <div
          className="rounded-2xl p-4"
          style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
        >
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: '#5D4AA8', letterSpacing: '1.2px' }}
          >
            Day Summary
          </p>
          {sessionCount === 0 ? (
            <p className="text-sm italic" style={{ color: '#A89EC0' }}>No appointments today</p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#7A7090' }}>Sessions</span>
                <span className="text-sm font-semibold" style={{ color: '#1E1830' }}>{sessionCount}</span>
              </div>
              {therapistCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#7A7090' }}>Therapists</span>
                  <span className="text-sm font-semibold" style={{ color: '#1E1830' }}>{therapistCount}</span>
                </div>
              )}
              {totalRevenue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#7A7090' }}>Revenue</span>
                  <span className="text-sm font-semibold" style={{ color: '#1E1830' }}>{formatRevenue(totalRevenue)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schedule list */}
        {sortedAppointments.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
          >
            <p
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: '#5D4AA8', letterSpacing: '1.2px' }}
            >
              Schedule
            </p>
            <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
              {sortedAppointments.map((appt) => {
                const clientName = appt.client
                  ? `${appt.client.firstName} ${appt.client.lastName}`
                  : 'Unknown';
                const therapistUser = (appt.therapist as any)?.user;
                const therapistName = therapistUser
                  ? `${therapistUser.firstName || ''} ${therapistUser.lastName || ''}`.trim()
                  : '';
                return (
                  <button
                    key={appt.id}
                    onClick={() => onAppointmentClick(appt)}
                    className="w-full text-left rounded-lg p-2.5"
                    style={{ border: '1px solid #EFE9F2' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F0FA')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium tabular-nums" style={{ color: '#5D4AA8' }}>
                        {format(new Date(appt.startTime), 'h:mm a')}
                      </span>
                      <span className="text-xs" style={{ color: '#7A7090' }}>
                        {format(new Date(appt.endTime), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: '#1E1830' }}>{clientName}</p>
                    {therapistName && (
                      <p className="text-xs truncate mt-0.5" style={{ color: '#7A7090' }}>{therapistName}</p>
                    )}
                    {appt.serviceType && (
                      <p className="text-xs truncate" style={{ color: '#A89EC0' }}>{appt.serviceType}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
