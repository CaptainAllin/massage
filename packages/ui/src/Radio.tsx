import * as React from 'react';
import { cn } from './utils';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const Radio = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ name, options, value, onChange, error, className, orientation = 'vertical' }, ref) => {
    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div
          className={cn(
            'flex gap-4',
            orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
          )}
        >
          {options.map((option) => {
            const radioId = `${name}-${option.value}`;
            return (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={radioId}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={option.disabled}
                  className={cn(
                    'h-5 w-5 border border-[#E5DEEC] text-[#5D4AA8] accent-[#5D4AA8]',
                    'focus:ring-2 focus:ring-[#5D4AA8] focus:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500'
                  )}
                />
                <label
                  htmlFor={radioId}
                  className={cn(
                    'ml-3 text-base text-foreground cursor-pointer select-none',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export { Radio };
