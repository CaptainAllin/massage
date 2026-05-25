import * as React from 'react';
import { cn } from './utils';

export interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  onRemove?: () => void;
  className?: string;
}

const Tag: React.FC<TagProps> = ({
  children,
  variant = 'default',
  size = 'md',
  onRemove,
  className,
}) => {
  const variantStyles = {
    default: 'bg-[#EDE5F4] text-[#5D4AA8] border-[#E5DEEC]',
    primary: 'bg-[#EDE5F4] text-[#5D4AA8] border-[#E5DEEC]',
    success: 'bg-[#EDE5F4] text-[#5D4AA8] border-[#E5DEEC]',
    warning: 'bg-[#F7E5DD] text-[#C97E68] border-[#E8A893]',
    danger: 'bg-red-100 text-red-700 border-red-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label="Remove tag"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

Tag.displayName = 'Tag';

export { Tag };
