import { AppointmentWithRelations, AppointmentStatus, GroupBookingStatus } from '@massage/types';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  onClick?: () => void;
}

// Iris 4-color appointment palette
const statusConfig: Record<AppointmentStatus, { border: string; bg: string; text: string }> = {
  [AppointmentStatus.SCHEDULED]:   { border: '#7A92D2', bg: '#EEF1F9', text: '#3D5490' },
  [AppointmentStatus.CONFIRMED]:   { border: '#5D4AA8', bg: '#EDE5F4', text: '#3F2F87' },
  [AppointmentStatus.IN_PROGRESS]: { border: '#C97E68', bg: '#F7E5DD', text: '#A05040' },
  [AppointmentStatus.COMPLETED]:   { border: '#8A9E88', bg: '#EAF0E9', text: '#4A6448' },
  [AppointmentStatus.CANCELLED]:   { border: '#C94040', bg: '#F5E5E5', text: '#922020' },
  [AppointmentStatus.NO_SHOW]:     { border: '#C94040', bg: '#F5E5E5', text: '#922020' },
};

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  const isGroup = (appointment as any).isGroup ?? false;
  const capacity = (appointment as any).capacity as number | null;
  const groupBookings = appointment.groupBookings ?? [];
  const activeCount = groupBookings.filter((b) => b.status !== GroupBookingStatus.CANCELLED).length;

  const displayName = isGroup
    ? (appointment.serviceType || 'Group Session')
    : (appointment.client
        ? `${appointment.client.firstName} ${appointment.client.lastName}`
        : 'Unknown');

  const therapistName = appointment.therapist?.user
    ? `${appointment.therapist.user.firstName || ''} ${appointment.therapist.user.lastName || ''}`
    : '';

  const cfg = statusConfig[appointment.status] ?? statusConfig[AppointmentStatus.CONFIRMED];
  const isCancelled =
    appointment.status === AppointmentStatus.CANCELLED ||
    appointment.status === AppointmentStatus.NO_SHOW;

  return (
    <div
      className="rounded-lg p-2 cursor-pointer transition-all hover:brightness-95"
      style={{
        borderLeft: `2.5px solid ${cfg.border}`,
        background: cfg.bg,
        opacity: isCancelled ? 0.55 : 1,
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        {isGroup && <Users size={11} style={{ color: cfg.text, opacity: 0.8, flexShrink: 0 }} />}
        <p
          className="text-xs font-semibold truncate leading-tight"
          style={{ color: cfg.text, textDecoration: isCancelled ? 'line-through' : 'none' }}
        >
          {displayName}
        </p>
      </div>
      {isGroup && (
        <p className="text-xs mt-0.5 font-medium" style={{ color: cfg.text, opacity: 0.8 }}>
          {activeCount}{capacity ? `/${capacity}` : ''} attendees
        </p>
      )}
      {!isGroup && therapistName && (
        <p className="text-xs truncate mt-0.5" style={{ color: cfg.text, opacity: 0.75 }}>
          {therapistName}
        </p>
      )}
      <p className="text-xs mt-1 tabular-nums" style={{ color: cfg.text, opacity: 0.85 }}>
        {format(startTime, 'h:mm')}–{format(endTime, 'h:mm a')}
      </p>
      {!isGroup && appointment.serviceType && (
        <p className="text-xs mt-0.5 truncate" style={{ color: cfg.text, opacity: 0.7 }}>
          {appointment.serviceType}
        </p>
      )}
    </div>
  );
}
