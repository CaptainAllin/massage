import { AppointmentStatus } from '@massage/types';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  AppointmentStatus,
  { label: string; color: string; bgColor: string }
> = {
  [AppointmentStatus.SCHEDULED]: {
    label: 'Scheduled',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  [AppointmentStatus.CONFIRMED]: {
    label: 'Confirmed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  [AppointmentStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  [AppointmentStatus.COMPLETED]: {
    label: 'Completed',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  [AppointmentStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  [AppointmentStatus.NO_SHOW]: {
    label: 'No Show',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

export function StatusBadge({ status, size: _size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
    >
      {config.label}
    </span>
  );
}
