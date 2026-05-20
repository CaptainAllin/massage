import * as React from 'react';
import { cn } from './utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[120px] w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-muted-foreground',
            'resize-y',
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

Textarea.displayName = 'Textarea';

export { Textarea };
