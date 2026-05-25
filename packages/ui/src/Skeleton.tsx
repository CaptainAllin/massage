import * as React from 'react';
import { cn } from './utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
}) => {
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const skeletonElement = (
    <div
      className={cn(
        'animate-pulse bg-[#EDE5F4]',
        variantStyles[variant],
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{skeletonElement}</React.Fragment>
      ))}
    </div>
  );
};

Skeleton.displayName = 'Skeleton';

export { Skeleton };
