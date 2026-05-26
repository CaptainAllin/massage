'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { apiClient } from '@/lib/api-client';

interface ExportRecord {
  id: string;
  exportType: string;
  format: string;
  status: string;
  fileName: string | null;
  fileSize: number | null;
  rowCount: number | null;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}


export default function ExportsPage() {
  const businessId = useBusinessId();
  const [exportType, setExportType] = useState('APPOINTMENTS');
  const [format, setFormat] = useState('CSV');
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchHistory = async () => {
    if (!businessId) return;
    setIsLoadingHistory(true);
    try {
      const res = await apiClient.get(`/exports?businessId=${businessId}`);
      setHistory(res.data.data ?? res.data ?? []);
    } catch {
      // silently ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [businessId]);

  const handleCreateExport = async () => {
    if (!businessId) return;
    setIsCreating(true);
    setCreateError('');
    try {
      const res = await apiClient.post('/exports', { businessId, exportType, format });
      const record = res.data.data ?? res.data;
      setHistory((prev) => [record, ...prev]);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.message || 'Export failed');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'PROCESSING':
      case 'PENDING': return <Clock className="h-5 w-5 text-yellow-600 animate-spin" />;
      case 'FAILED': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
      case 'PROCESSING':
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'FAILED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Data</p>
        <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Exports</h1>
        <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
          Export your practice data for analysis, compliance, or backup
        </p>
      </div>

      {/* Compliance note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">HIPAA & Compliance</h3>
            <p className="text-sm text-blue-800 mt-0.5">
              All exports include audit logging. For HIPAA compliance, exported files containing PHI should be stored securely and access should be tracked. Exports expire after 7 days.
            </p>
          </div>
        </div>
      </div>

      {/* Create Export Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(93,74,168,0.06)' }}>
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-purple-600" />
          Create New Export
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Type</label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="APPOINTMENTS">Appointments</option>
              <option value="CLIENTS">Clients</option>
              <option value="PAYMENTS">Payments</option>
              <option value="INVOICES">Invoices</option>
              <option value="TREATMENT_NOTES">Treatment Notes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="CSV">CSV (.csv)</option>
              <option value="PDF">PDF (.pdf)</option>
              <option value="EXCEL">Excel (.xlsx)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleCreateExport}
              disabled={isCreating || !businessId}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
              style={{ background: '#5D4AA8' }}
            >
              <Download className="h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create Export'}
            </button>
          </div>
        </div>

        {createError && (
          <p className="mt-3 text-sm text-red-600">{createError}</p>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Exports are available for download for 7 days. Large exports may take a few minutes to generate.
        </p>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-xl border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(93,74,168,0.06)' }}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Export History
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Last 50 exports</p>
          </div>
          <button
            onClick={fetchHistory}
            disabled={isLoadingHistory}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rows</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoadingHistory && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</td>
                </tr>
              )}
              {!isLoadingHistory && history.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No exports yet</p>
                    <p className="text-gray-400 text-xs mt-1">Create your first export above</p>
                  </td>
                </tr>
              )}
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-900 font-medium">{item.exportType}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{item.format}</td>
                  <td className="px-5 py-3.5 text-gray-700 max-w-[200px] truncate">{item.fileName || '—'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{item.rowCount?.toLocaleString() ?? '—'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-xs">
                    {new Date(item.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {item.status === 'COMPLETED' && item.fileName ? (
                      <button className="text-purple-600 hover:text-purple-800 font-medium text-xs flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
