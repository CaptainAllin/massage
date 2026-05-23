import React, { useState } from 'react';
import { Button } from '@massage/ui';
import { ExportModal } from './ExportModal';

export interface ExportButtonProps {
  exportType: 'APPOINTMENTS' | 'CLIENTS' | 'PAYMENTS' | 'INVOICES' | 'ANALYTICS' | 'TREATMENT_NOTES';
  filters?: Record<string, any>;
  variant?: 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  exportType,
  filters,
  variant = 'outline',
  size = 'md',
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Export
      </Button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exportType={exportType}
        filters={filters}
      />
    </>
  );
};
