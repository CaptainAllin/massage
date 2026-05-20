import * as React from 'react';
import { cn } from './utils';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'line' | 'pills';
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'flex',
          variant === 'line' ? 'border-b border-gray-200' : 'gap-2'
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (variant === 'line') {
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onChange(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'px-4 py-3 text-base font-medium transition-colors',
                  'border-b-2 -mb-px',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </div>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'px-4 py-2 text-base font-medium rounded-xl transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';

export { Tabs };
