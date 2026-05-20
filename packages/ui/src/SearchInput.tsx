import * as React from 'react';
import { cn } from './utils';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            'flex h-11 w-full rounded-xl border-2 border-input bg-background pl-12 pr-12 py-2 text-base',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-muted-foreground',
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
