'use client';

import React from 'react';
import type { DashboardAppointment } from '@/lib/types/dashboard';
import { Avatar, StatusChip } from '@/components/mobile/primitives';

const STATUS_DOT: Record<string, string> = {
  scheduled: '#A79FB5',
  confirmed: '#5D4AA8',
  completed: '#3E9E7A',
  cancelled: '#D9D4E8',
  no_show: '#C2724F',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface ScheduleListProps {
  appointments: DashboardAppointment[];
  onViewAll?: () => void;
  maxVisible?: number;
}

export function ScheduleList({ appointments, onViewAll, maxVisible = 5 }: ScheduleListProps) {
  const visible = appointments.slice(0, maxVisible);

  return (
    <div
      style={{
        background: 'var(--m-surface)',
        borderRadius: 22,
        border: '1px solid #F1EEF6',
        boxShadow: '0 1px 2px rgba(30,24,48,0.04)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#1E1830',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            Today&apos;s Schedule
          </span>
          <span
            style={{
              background: '#5D4AA822',
              color: '#5D4AA8',
              borderRadius: 100,
              padding: '1px 8px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            {appointments.length}
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#5D4AA8',
              fontWeight: 600,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              padding: 0,
            }}
          >
            View all →
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#A79FB5',
            fontSize: 13,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
          }}
        >
          No sessions today — go to Appointments to book
        </div>
      ) : (
        <div>
          {visible.map((appt, i) => {
            const clientName = appt.client
              ? `${appt.client.firstName} ${appt.client.lastName}`
              : 'Unknown';
            const service = appt.serviceType ?? '—';

            return (
              <div
                key={appt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderTop: i > 0 ? '1px solid #F4F3F8' : undefined,
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar name={clientName} size={36} />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: STATUS_DOT[appt.status.toLowerCase()] ?? '#A79FB5',
                      border: '1.5px solid white',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#7E748F',
                        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(appt.startTime)}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#1E1830',
                        fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {clientName}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11.5,
                      color: '#7E748F',
                      fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {service}
                  </span>
                </div>
                <StatusChip status={appt.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
