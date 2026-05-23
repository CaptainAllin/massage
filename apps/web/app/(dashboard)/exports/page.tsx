'use client';

import React, { useState } from 'react';
import { Download, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function ExportsPage() {
  const [exportType, setExportType] = useState('APPOINTMENTS');
  const [format, setFormat] = useState('CSV');

  // Mock export history - in real app, fetch from API
  const exportHistory = [
    {
      id: '1',
      exportType: 'APPOINTMENTS',
      format: 'CSV',
      status: 'COMPLETED',
      fileName: 'appointments_2026-05-21.csv',
      fileSize: '2.5 MB',
      rowCount: 1250,
      createdAt: '2026-05-21T10:30:00Z',
    },
    {
      id: '2',
      exportType: 'CLIENTS',
      format: 'PDF',
      status: 'COMPLETED',
      fileName: 'clients_2026-05-20.pdf',
      fileSize: '1.8 MB',
      rowCount: 450,
      createdAt: '2026-05-20T15:45:00Z',
    },
    {
      id: '3',
      exportType: 'PAYMENTS',
      format: 'EXCEL',
      status: 'PROCESSING',
      fileName: null,
      fileSize: null,
      rowCount: null,
      createdAt: '2026-05-21T12:00:00Z',
    },
  ];

  const handleCreateExport = () => {
    alert(`Creating ${format} export of ${exportType}...\n\n(This will connect to the backend API)`);
    // TODO: Call API to create export
    // const response = await apiClient.post('/export', { exportType, format });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'PROCESSING':
        return <Clock className="h-5 w-5 text-yellow-600 animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PROCESSING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Exports</h1>
        <p className="text-sm text-gray-600 mt-1">
          Export your data in various formats for analysis or backup
        </p>
      </div>

      {/* Create Export Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-600" />
          Create New Export
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Type
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="APPOINTMENTS">Appointments</option>
              <option value="CLIENTS">Clients</option>
              <option value="PAYMENTS">Payments</option>
              <option value="INVOICES">Invoices</option>
              <option value="TREATMENT_NOTES">Treatment Notes</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CSV">CSV (.csv)</option>
              <option value="PDF">PDF (.pdf)</option>
              <option value="EXCEL">Excel (.xlsx)</option>
            </select>
          </div>

          {/* Action */}
          <div className="flex items-end">
            <button
              onClick={handleCreateExport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Create Export
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Exports are available for 7 days. Large exports may take a few minutes to generate.
          </p>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Export History
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Recent exports (last 50)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rows
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exportHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.exportType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.format}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.fileName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.fileSize || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.rowCount?.toLocaleString() || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.status === 'COMPLETED' ? (
                      <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {exportHistory.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No exports yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first export above
            </p>
          </div>
        )}
      </div>

      {/* Feature Status Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">
              Backend Integration Ready
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              This page is ready to connect to the backend API. The export service is fully implemented with CSV, PDF, and Excel support. Just connect the buttons to the API endpoints and you're good to go!
            </p>
            <p className="text-xs text-amber-700 mt-2">
              API: <code className="bg-amber-100 px-1 py-0.5 rounded">POST /api/v1/export</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
