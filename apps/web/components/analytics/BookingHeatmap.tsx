'use client';

import { useMemo } from 'react';
import { Card } from '@massage/ui';

export interface HeatmapData {
  dayOfWeek: number;
  hour: number;
  count: number;
}

interface BookingHeatmapProps {
  data: HeatmapData[];
  title?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

export function BookingHeatmap({ data, title = 'Booking Patterns' }: BookingHeatmapProps) {
  const heatmapMatrix = useMemo(() => {
    const matrix = Array.from({ length: 7 }, () =>
      Array.from({ length: 14 }, () => 0)
    );

    data.forEach(({ dayOfWeek, hour, count }) => {
      if (hour >= 8 && hour <= 21 && dayOfWeek >= 0 && dayOfWeek <= 6) {
        matrix[dayOfWeek][hour - 8] = count;
      }
    });

    return matrix;
  }, [data]);

  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';

    const intensity = count / maxCount;

    if (intensity >= 0.75) return 'bg-blue-600';
    if (intensity >= 0.5) return 'bg-blue-500';
    if (intensity >= 0.25) return 'bg-blue-400';
    return 'bg-blue-300';
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${period}`;
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header with hours */}
          <div className="mb-2 flex">
            <div className="w-12 flex-shrink-0" />
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex w-12 flex-shrink-0 items-center justify-center text-xs text-gray-600"
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center">
                <div className="w-12 flex-shrink-0 pr-2 text-xs font-medium text-gray-700">
                  {day}
                </div>
                <div className="flex gap-1">
                  {HOURS.map((hour, hourIndex) => {
                    const count = heatmapMatrix[dayIndex][hourIndex];
                    return (
                      <div
                        key={`${dayIndex}-${hourIndex}`}
                        className={`group relative h-10 w-12 rounded ${getColor(count)} transition-all hover:ring-2 hover:ring-blue-600 hover:ring-offset-1`}
                        title={`${day} ${formatHour(hour)}: ${count} bookings`}
                      >
                        {/* Tooltip on hover */}
                        <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                          <div className="font-medium">{day} {formatHour(hour)}</div>
                          <div>{count} bookings</div>
                          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-xs text-gray-600">Less</span>
            <div className="flex gap-1">
              <div className="h-4 w-4 rounded bg-gray-100" />
              <div className="h-4 w-4 rounded bg-blue-300" />
              <div className="h-4 w-4 rounded bg-blue-400" />
              <div className="h-4 w-4 rounded bg-blue-500" />
              <div className="h-4 w-4 rounded bg-blue-600" />
            </div>
            <span className="text-xs text-gray-600">More</span>
          </div>
        </div>
      </div>

      {data.length === 0 && (
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-gray-500">No booking data available for this period</p>
        </div>
      )}
    </Card>
  );
}
