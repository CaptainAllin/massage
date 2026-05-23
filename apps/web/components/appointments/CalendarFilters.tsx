import { Select, Button } from '@massage/ui';
import { AppointmentStatus, Therapist } from '@massage/types';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarFiltersProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedTherapist: string | null;
  onTherapistChange: (therapistId: string | null) => void;
  selectedStatuses: AppointmentStatus[];
  onStatusesChange: (statuses: AppointmentStatus[]) => void;
  therapists: Therapist[];
  viewMode: 'week' | 'day';
  onViewModeChange: (mode: 'week' | 'day') => void;
}

const statusOptions = [
  { value: AppointmentStatus.SCHEDULED, label: 'Scheduled' },
  { value: AppointmentStatus.CONFIRMED, label: 'Confirmed' },
  { value: AppointmentStatus.IN_PROGRESS, label: 'In Progress' },
  { value: AppointmentStatus.COMPLETED, label: 'Completed' },
  { value: AppointmentStatus.CANCELLED, label: 'Cancelled' },
  { value: AppointmentStatus.NO_SHOW, label: 'No Show' },
];

export function CalendarFilters({
  currentDate,
  onDateChange,
  selectedTherapist,
  onTherapistChange,
  selectedStatuses,
  onStatusesChange,
  therapists,
  viewMode,
  onViewModeChange,
}: CalendarFiltersProps) {
  const handlePreviousWeek = () => {
    onDateChange(subDays(currentDate, viewMode === 'week' ? 7 : 1));
  };

  const handleNextWeek = () => {
    onDateChange(addDays(currentDate, viewMode === 'week' ? 7 : 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleStatusToggle = (status: AppointmentStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const therapistOptions = [
    { value: 'all', label: 'All Therapists' },
    ...therapists.map((therapist: any) => ({
      value: therapist.id,
      label: therapist.user
        ? `${therapist.user.firstName || ''} ${therapist.user.lastName || ''}`
        : 'Unknown',
    })),
  ];

  return (
    <div className="space-y-3">
      {/* View Mode and Date Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
            onClick={() => onViewModeChange('week')}
            size="sm"
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'day' ? 'primary' : 'secondary'}
            onClick={() => onViewModeChange('day')}
            size="sm"
          >
            Day
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handlePreviousWeek} size="sm">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <span className="text-xs sm:text-sm font-semibold text-gray-900 min-w-[100px] sm:min-w-[140px] text-center">
            {viewMode === 'week'
              ? `Week of ${format(currentDate, 'MMM d')}`
              : format(currentDate, 'MMM d, yyyy')}
          </span>

          <Button variant="secondary" onClick={handleNextWeek} size="sm">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>

          <Button variant="secondary" onClick={handleToday} size="sm">
            Today
          </Button>
        </div>
      </div>

      {/* Therapist and Status Filters */}
      <div className="flex flex-wrap items-start gap-3">
        {/* Therapist Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Therapist:</label>
          <Select
            value={selectedTherapist || 'all'}
            onChange={(e) =>
              onTherapistChange(e.target.value === 'all' ? null : e.target.value)
            }
            options={therapistOptions}
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
          <div className="flex gap-1.5 flex-wrap">
            {statusOptions.map((option) => {
              const isSelected = selectedStatuses.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusToggle(option.value)}
                  className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                    isSelected
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
