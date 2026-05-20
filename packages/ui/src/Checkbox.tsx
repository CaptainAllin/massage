import * as React from 'react';
import { cn } from './utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="w-full">
        <div className="flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'h-5 w-5 rounded border-2 border-input text-primary',
              'focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="ml-3 text-base text-foreground cursor-pointer select-none"
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
