import React, { useEffect, useState } from 'react';
import { Button } from '@massage/ui';

export interface ExportProgressProps {
  exportId: string;
  onComplete: () => void;
}

interface ExportStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName: string | null;
  fileUrl: string | null;
  errorMessage: string | null;
  rowCount: number | null;
}

export const ExportProgress: React.FC<ExportProgressProps> = ({
  exportId,
  onComplete,
}) => {
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/export/${exportId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch export status');
        }

        const data = await response.json();
        setExportStatus(data);

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error polling export status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [exportId, isPolling]);

  const handleDownload = () => {
    if (exportStatus?.fileUrl) {
      window.location.href = exportStatus.fileUrl;
      setTimeout(onComplete, 1000); // Close modal after download starts
    }
  };

  if (!exportStatus) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
        <p className="mt-4 text-sm text-gray-600">Initializing export...</p>
      </div>
    );
  }

  if (exportStatus.status === 'FAILED') {
    return (
      <div className="py-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
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
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Export Failed</h3>
          <p className="mt-2 text-sm text-gray-500 text-center">
            {exportStatus.errorMessage || 'An error occurred during export'}
          </p>
          <Button onClick={onComplete} className="mt-6">
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (exportStatus.status === 'COMPLETED') {
    return (
      <div className="py-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Export Complete!</h3>
          <p className="mt-2 text-sm text-gray-500">
            {exportStatus.rowCount} records exported
          </p>
          <div className="mt-6 space-y-3 w-full">
            <Button onClick={handleDownload} className="w-full">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download {exportStatus.fileName}
            </Button>
            <Button onClick={onComplete} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PROCESSING or PENDING
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sage-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sage-600 font-bold text-lg">
            {exportStatus.status === 'PROCESSING' ? '...' : '...'}
          </div>
        </div>
      </div>
      <h3 className="mt-6 text-lg font-medium text-gray-900">
        {exportStatus.status === 'PROCESSING' ? 'Processing Export' : 'Preparing Export'}
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        This may take a few moments...
      </p>
      <div className="mt-4 w-full max-w-xs">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-sage-600 h-2 animate-pulse" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};
