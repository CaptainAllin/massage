import * as React from 'react';
import { cn } from './utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center p-12 text-center', className)}
        {...props}
      >
        {icon && (
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#EDE5F4] text-[#7A7090]">
            {icon}
          </div>
        )}
        <h3 className="mb-2 text-xl font-semibold text-foreground font-display">{title}</h3>
        {description && (
          <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div>{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };
