import * as React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'secondary';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-[#EDE5F4] text-[#5D4AA8]',
      success: 'bg-[#EDE5F4] text-[#5D4AA8]',
      warning: 'bg-[#F7E5DD] text-[#C97E68]',
      danger: 'bg-red-100 text-red-800',
      secondary: 'bg-[#EFE9F2] text-[#3D3450]',
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
