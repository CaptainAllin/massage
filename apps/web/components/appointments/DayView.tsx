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
}

const DRAGGABLE_STATUSES = new Set([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]);

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm

export function DayView({
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
  onAppointmentDrop,
}: DayViewProps) {
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const draggingRef = useRef<{ id: string; originalStart: Date } | null>(null);
  // Filter appointments for the current day and group by hour
  const appointmentsByHour = useMemo(() => {
    const grouped: Record<number, AppointmentWithRelations[]> = {};

    appointments
      .filter((apt) => isSameDay(new Date(apt.startTime), currentDate))
      .forEach((appointment) => {
        const hour = new Date(appointment.startTime).getHours();
        if (!grouped[hour]) {
          grouped[hour] = [];
        }
        grouped[hour].push(appointment);
      });

    return grouped;
  }, [appointments, currentDate]);

  const getAppointmentsForHour = (hour: number) => {
    return appointmentsByHour[hour] || [];
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 overflow-hidden">
      {/* Day Header */}
      <div className={`p-6 border-b border-gray-200 ${isToday ? 'bg-sage-50' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {format(currentDate, 'EEEE')}
          </div>
          <div className={`text-4xl font-bold mt-2 ${isToday ? 'text-sage-600' : 'text-gray-900'}`}>
            {format(currentDate, 'd')}
          </div>
          <div className="text-lg text-gray-600 mt-1">
            {format(currentDate, 'MMMM yyyy')}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {HOURS.map((hour) => {
          const appointmentsInHour = getAppointmentsForHour(hour);
          const slotDateTime = setMinutes(setHours(currentDate, hour), 0);

          return (
            <div
              key={hour}
              className="grid grid-cols-[120px_1fr] border-b border-gray-100 min-h-[100px]"
            >
              {/* Hour Label */}
              <div className="p-4 bg-gray-50 flex items-start justify-end border-r border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  {format(setHours(new Date(), hour), 'h:mm a')}
                </span>
              </div>

              {/* Appointment Slot */}
              <div
                className="p-4 cursor-pointer transition-colors"
                style={{
                  background: dragOverHour === hour ? '#EDE5F4' : undefined,
                  outline: dragOverHour === hour ? '2px solid #5D4AA8' : 'none',
                  outlineOffset: '-2px',
                }}
                onClick={() => onSlotClick(slotDateTime, hour)}
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
                  <div className="space-y-2">
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
                          onDragEnd={() => {
                            draggingRef.current = null;
                            setDragOverHour(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(appointment);
                          }}
                        >
                          <AppointmentCard appointment={appointment} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">Click to schedule</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
