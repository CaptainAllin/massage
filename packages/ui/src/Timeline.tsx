import * as React from 'react';
import { cn } from './utils';

export interface TimelineItem {
  id: string;
  date: Date;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  metadata?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  const colorStyles = {
    primary: 'bg-primary border-primary',
    secondary: 'bg-secondary border-secondary',
    success: 'bg-green-500 border-green-500',
    warning: 'bg-yellow-500 border-yellow-500',
    danger: 'bg-red-500 border-red-500',
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Timeline items */}
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="relative flex gap-4">
            {/* Icon/Dot */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white',
                colorStyles[item.color || 'primary']
              )}
            >
              {item.icon ? (
                <div className="text-white text-xs">{item.icon}</div>
              ) : (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                  )}
                  {item.metadata && <div className="mt-2">{item.metadata}</div>}
                </div>
                <time className="text-sm text-gray-500">{formatDate(item.date)}</time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Timeline.displayName = 'Timeline';

export { Timeline };
