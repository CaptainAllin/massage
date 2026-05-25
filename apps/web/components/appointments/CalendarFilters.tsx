import { AppointmentStatus, Therapist } from '@massage/types';
import { format, addDays, subDays, addMonths, subMonths, getWeek, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { APT_COLORS, colorForTherapist } from '@/lib/appointment-colors';

export { colorForTherapist as getTherapistColor };

interface CalendarFiltersProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedTherapist: string | null;
  onTherapistChange: (therapistId: string | null) => void;
  selectedStatuses: AppointmentStatus[];
  onStatusesChange: (statuses: AppointmentStatus[]) => void;
  therapists: Therapist[];
  viewMode: 'week' | 'day' | 'month';
  onViewModeChange: (mode: 'week' | 'day' | 'month') => void;
}

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
  const handlePrev = () => {
    if (viewMode === 'day') onDateChange(subDays(currentDate, 1));
    else if (viewMode === 'month') onDateChange(subMonths(currentDate, 1));
    else onDateChange(subDays(currentDate, 7));
  };

  const handleNext = () => {
    if (viewMode === 'day') onDateChange(addDays(currentDate, 1));
    else if (viewMode === 'month') onDateChange(addMonths(currentDate, 1));
    else onDateChange(addDays(currentDate, 7));
  };

  const handleToday = () => onDateChange(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekNum = getWeek(currentDate, { weekStartsOn: 0 });

  const dateLabel =
    viewMode === 'day'
      ? format(currentDate, 'EEE, d MMM yyyy')
      : viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy')
      : `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`;

  return (
    <div className="space-y-3">
      {/* Row 1: View toggle + date navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Day / Week / Month toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: '#EDE5F4' }}
        >
          {(['day', 'week', 'month'] as const).map((mode) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className="px-3 py-1 rounded-lg text-sm font-medium transition-all capitalize"
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(93,74,168,0.30)',
                      }
                    : { color: '#5D4AA8', background: 'transparent' }
                }
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ border: '1px solid #E5DEEC', background: '#fff', color: '#3D3450' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE5F4')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          <div className="text-center min-w-[160px]">
            <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>{dateLabel}</p>
            {viewMode === 'week' && (
              <p className="text-xs" style={{ color: '#7A7090' }}>Week {weekNum}</p>
            )}
          </div>

          <button
            onClick={handleNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ border: '1px solid #E5DEEC', background: '#fff', color: '#3D3450' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE5F4')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            style={{ border: '1px solid #E5DEEC', background: '#fff', color: '#5D4AA8' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE5F4')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            Today
          </button>
        </div>
      </div>

      {/* Row 2: Therapist filter strip */}
      {therapists.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* All chip */}
          <button
            onClick={() => onTherapistChange(null)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all"
            style={
              selectedTherapist === null
                ? {
                    background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(93,74,168,0.28)',
                  }
                : { border: '1px solid #E5DEEC', background: '#fff', color: '#3D3450' }
            }
          >
            All
          </button>

          {therapists.map((therapist, idx) => {
            const color = APT_COLORS[idx % APT_COLORS.length];
            const isSelected = selectedTherapist === therapist.id;
            const name = therapist.user
              ? `${therapist.user.firstName || ''} ${therapist.user.lastName || ''}`.trim()
              : 'Unknown';

            return (
              <button
                key={therapist.id}
                onClick={() => onTherapistChange(therapist.id)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all"
                style={
                  isSelected
                    ? { background: color + '22', border: `1px solid ${color}`, color: color }
                    : { border: '1px solid #E5DEEC', background: '#fff', color: '#3D3450' }
                }
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
