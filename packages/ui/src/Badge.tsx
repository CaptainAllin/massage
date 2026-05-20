import * as React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'secondary';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-primary/10 text-primary',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      secondary: 'bg-secondary text-secondary-foreground',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors',
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
