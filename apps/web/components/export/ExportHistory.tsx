import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@massage/ui';

interface ExportRecord {
  id: string;
  exportType: string;
  format: string;
  status: string;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  rowCount: number | null;
  requestedAt: string;
  completedAt: string | null;
  downloadCount: number;
  errorMessage: string | null;
}

export const ExportHistory: React.FC = () => {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExportHistory();
  }, []);

  const fetchExportHistory = async () => {
    try {
      const response = await fetch('/api/v1/export/history');
      if (!response.ok) {
        throw new Error('Failed to fetch export history');
      }
      const data = await response.json();
      setExports(data);
    } catch (error) {
      console.error('Error fetching export history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (fileUrl: string) => {
    window.location.href = fileUrl;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      COMPLETED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (exports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2">No exports yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exports.map((exportRecord) => (
            <div
              key={exportRecord.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">
                      {exportRecord.exportType}
                    </h4>
                    {getStatusBadge(exportRecord.status)}
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{exportRecord.format}</span>
                    <span>•</span>
                    <span>{formatDate(exportRecord.requestedAt)}</span>
                    {exportRecord.rowCount !== null && (
                      <>
                        <span>•</span>
                        <span>{exportRecord.rowCount.toLocaleString()} records</span>
                      </>
                    )}
                    {exportRecord.fileSize !== null && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(exportRecord.fileSize)}</span>
                      </>
                    )}
                  </div>
                  {exportRecord.errorMessage && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {exportRecord.errorMessage}
                    </div>
                  )}
                </div>
                {exportRecord.status === 'COMPLETED' && exportRecord.fileUrl && (
                  <button
                    onClick={() => handleDownload(exportRecord.fileUrl!)}
                    className="ml-4 px-4 py-2 text-sm font-medium text-sage-700 bg-sage-100 rounded-md hover:bg-sage-200 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 inline mr-1"
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
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
