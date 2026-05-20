import * as React from 'react';
import { cn } from './utils';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          type="date"
          className={cn(
            'flex h-11 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-base',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-muted-foreground',
            '[color-scheme:light]',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
