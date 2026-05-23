import React, { useState } from 'react';
import { Modal, Button } from '@massage/ui';
import { ExportProgress } from './ExportProgress';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: string;
  filters?: Record<string, any>;
}

type ExportFormat = 'CSV' | 'PDF' | 'EXCEL';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exportType,
  filters,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('CSV');
  const [isExporting, setIsExporting] = useState(false);
  const [exportId, setExportId] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState('');

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/v1/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exportType,
          format: selectedFormat,
          filters,
          emailTo: emailTo || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      setExportId(result.id);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setIsExporting(false);
    setExportId(null);
    setEmailTo('');
    onClose();
  };

  if (isExporting && exportId) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Export in Progress">
        <ExportProgress exportId={exportId} onComplete={handleClose} />
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Export ${exportType}`}>
      <div className="space-y-6 py-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['CSV', 'PDF', 'EXCEL'] as ExportFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`
                  px-4 py-3 rounded-lg border-2 text-center transition-all
                  ${
                    selectedFormat === format
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <div className="font-medium">{format}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {format === 'CSV' && '.csv'}
                  {format === 'PDF' && '.pdf'}
                  {format === 'EXCEL' && '.xlsx'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Email Option */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Export (Optional)
          </label>
          <input
            type="email"
            id="email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to download directly
          </p>
        </div>

        {/* Filter Summary */}
        {filters && Object.keys(filters).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Applied Filters
            </h4>
            <div className="space-y-1">
              {Object.entries(filters).map(([key, value]) => (
                <div key={key} className="text-xs text-gray-600">
                  <span className="font-medium">{key}:</span>{' '}
                  {JSON.stringify(value)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
