import { AppointmentWithRelations, AppointmentStatus } from '@massage/types';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';

interface AppointmentCardProps {
  appointment: AppointmentWithRelations;
  onClick?: () => void;
}

const statusStyles: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'border-l-4 border-l-blue-500 bg-blue-50',
  [AppointmentStatus.CONFIRMED]: 'border-l-4 border-l-green-500 bg-green-50',
  [AppointmentStatus.IN_PROGRESS]: 'border-l-4 border-l-orange-500 bg-orange-50',
  [AppointmentStatus.COMPLETED]: 'border-l-4 border-l-gray-400 bg-gray-50',
  [AppointmentStatus.CANCELLED]: 'border-l-4 border-l-red-500 bg-red-50 opacity-60',
  [AppointmentStatus.NO_SHOW]: 'border-l-4 border-l-red-500 bg-red-50 opacity-60',
};

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  const clientName = appointment.client
    ? `${appointment.client.firstName} ${appointment.client.lastName}`
    : 'Unknown Client';
  const therapistName = appointment.therapist?.user
    ? `${appointment.therapist.user.firstName || ''} ${appointment.therapist.user.lastName || ''}`
    : 'Unknown Therapist';

  return (
    <div
      className={`rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
        statusStyles[appointment.status]
      } ${appointment.status === AppointmentStatus.CANCELLED ? 'line-through' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {clientName}
          </p>
          <p className="text-xs text-gray-600 truncate">{therapistName}</p>
        </div>
        <StatusBadge status={appointment.status} size="sm" />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="font-medium">
          {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
        </span>
        <span className="text-gray-400">•</span>
        <span>{appointment.duration} min</span>
      </div>

      {appointment.serviceType && (
        <p className="text-xs text-gray-500 mt-1 truncate">
          {appointment.serviceType}
        </p>
      )}

      {appointment.price && (
        <p className="text-xs text-gray-700 font-medium mt-1">
          ${appointment.price.toFixed(2)}
        </p>
      )}
    </div>
  );
}
