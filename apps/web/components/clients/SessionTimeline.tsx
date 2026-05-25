'use client';

import React from 'react';
import { Appointment, AppointmentStatus } from '@massage/types';
import { colorForId } from '@/lib/appointment-colors';

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
  IN_PROGRESS: 'In progress',
  CONFIRMED: 'Confirmed',
  SCHEDULED: 'Scheduled',
};

interface SessionTimelineProps {
  appointments: Appointment[];
  isLoading?: boolean;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ appointments, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <div className="w-3.5 h-3.5 rounded-full bg-iris-soft1" />
              <div className="w-0.5 h-12 bg-iris-line2" />
            </div>
            <div className="flex-1 pb-6">
              <div className="h-4 bg-iris-soft1 rounded w-40 mb-2" />
              <div className="h-3 bg-iris-soft1 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!appointments.length) {
    return (
      <div className="text-center py-10 text-iris-muted text-sm">No sessions recorded yet.</div>
    );
  }

  const sorted = [...appointments].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <div className="relative">
      {/* 7.4.1 Vertical timeline line */}
      <div
        className="absolute left-[6px] top-2 bottom-2 w-0.5"
        style={{ background: '#EFE9F2' }}
      />

      <div className="space-y-0">
        {sorted.map((apt) => {
          const isActive = apt.status === AppointmentStatus.IN_PROGRESS;
          const isCancelled =
            apt.status === AppointmentStatus.CANCELLED ||
            apt.status === AppointmentStatus.NO_SHOW;
          const dotColor = colorForId(apt.therapistId);
          const date = new Date(apt.startTime);

          return (
            <div key={apt.id} className="flex gap-5 pb-6 last:pb-0">
              {/* 7.4.1/7.4.2/7.4.3 Dot */}
              <div className="flex flex-col items-center flex-shrink-0 pt-0.5" style={{ width: 14 }}>
                {isActive ? (
                  /* 7.4.2 Active dot */
                  <div
                    className="w-3.5 h-3.5 rounded-full z-10 flex-shrink-0"
                    style={{
                      background: dotColor,
                      boxShadow: `0 0 0 4px ${dotColor}22`,
                    }}
                  />
                ) : (
                  /* 7.4.3 Past dot */
                  <div
                    className="w-3.5 h-3.5 rounded-full bg-white z-10 flex-shrink-0"
                    style={{ border: `2px solid #7665C2` }}
                  />
                )}
              </div>

              {/* 7.4.4 Row content */}
              <div className="flex-1 flex items-start justify-between gap-4 -mt-0.5">
                <div>
                  <p
                    className="text-[13.5px] font-medium leading-snug"
                    style={{
                      color: isCancelled ? '#7A7090' : '#1E1830',
                      textDecoration: isCancelled ? 'line-through' : 'none',
                    }}
                  >
                    {apt.serviceType || 'Session'}
                  </p>
                  <p className="text-[12px] text-iris-muted mt-0.5">
                    {date.toLocaleDateString('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    ·{' '}
                    {date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
                    {' · '}
                    {apt.duration} min
                  </p>
                  <span
                    className="inline-block mt-1.5 px-2 py-[2px] rounded-full text-[10.5px] font-medium"
                    style={
                      isActive
                        ? { background: '#EDE5F4', color: '#5D4AA8' }
                        : isCancelled
                        ? { background: '#F7E5DD', color: '#C97E68' }
                        : { background: '#EDE5F4', color: '#3D3450' }
                    }
                  >
                    {STATUS_LABEL[apt.status] || apt.status}
                  </span>
                </div>

                {apt.price != null && (
                  <p
                    className="text-[14px] font-medium tabular-nums flex-shrink-0"
                    style={{ color: isCancelled ? '#7A7090' : '#1E1830' }}
                  >
                    ${apt.price.toFixed(0)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
