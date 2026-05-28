'use client';

import React, { useState, useEffect } from 'react';
import {
  Download, FileText, CheckCircle, Clock, AlertCircle, RefreshCw,
  Filter, Archive, Calendar, Plus, Trash2, ToggleLeft, ToggleRight,
  Shield, Bell,
} from 'lucide-react';
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
  filters: Record<string, string> | null;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  downloadCount: number;
  expiresAt: string | null;
  triggeredBy: string | null;
}

interface ScheduledExport {
  id: string;
  name: string;
  exportType: string;
  format: string;
  frequency: string;
  emailTo: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  createdAt: string;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  therapistId: string;
  status: string;
  clientId: string;
}

const APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

const EXPORT_TYPE_LABELS: Record<string, string> = {
  APPOINTMENTS: 'Appointments',
  CLIENTS: 'Clients',
  PAYMENTS: 'Payments',
  INVOICES: 'Invoices & Payments',
  TREATMENT_NOTES: 'Treatment Notes',
  FULL_PRACTICE: 'Full Practice Data (ZIP)',
};

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

export default function ExportsPage() {
  const businessId = useBusinessId();

  // One-off export state
  const [exportType, setExportType] = useState('APPOINTMENTS');
  const [format, setFormat] = useState('CSV');
  const [filters, setFilters] = useState<Filters>({ dateFrom: '', dateTo: '', therapistId: '', status: '', clientId: '' });
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Scheduled exports state
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: '', exportType: 'APPOINTMENTS', format: 'CSV',
    frequency: 'WEEKLY', emailTo: '',
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // GDPR export state
  const [isGdprExporting, setIsGdprExporting] = useState(false);
  const [gdprDone, setGdprDone] = useState(false);

  const fetchHistory = async () => {
    if (!businessId) return;
    setIsLoadingHistory(true);
    try {
      const r = await apiClient.get(`/exports?businessId=${businessId}`);
      setHistory(r.data.data ?? r.data ?? []);
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchSchedules = async () => {
    if (!businessId) return;
    setIsLoadingSchedules(true);
    try {
      const r = await apiClient.get(`/exports/scheduled?businessId=${businessId}`);
      setSchedules(r.data.data ?? r.data ?? []);
    } catch {
      // ignore
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchSchedules();
  }, [businessId]);

  const handleCreateExport = async (overrides?: Partial<{ exportType: string; triggeredBy: string }>) => {
    if (!businessId) return;
    setIsCreating(true);
    setCreateError('');
    const activeFilters: Record<string, string> = {};
    if (filters.dateFrom) activeFilters.dateFrom = filters.dateFrom;
    if (filters.dateTo) activeFilters.dateTo = filters.dateTo;
    if (filters.therapistId) activeFilters.therapistId = filters.therapistId;
    if (filters.status) activeFilters.status = filters.status;
    if (filters.clientId) activeFilters.clientId = filters.clientId;

    const type = overrides?.exportType ?? exportType;
    const fmt = type === 'FULL_PRACTICE' && format === 'PDF' ? 'CSV' : format;

    try {
      const r = await apiClient.post('/exports', {
        businessId,
        exportType: type,
        format: fmt,
        filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        triggeredBy: overrides?.triggeredBy ?? 'MANUAL',
      });
      const record = r.data.data ?? r.data;
      setHistory((prev) => [record, ...prev]);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.message || 'Export failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGdprExport = async () => {
    if (!businessId) return;
    setIsGdprExporting(true);
    setGdprDone(false);
    try {
      const r = await apiClient.post('/exports', {
        businessId,
        exportType: 'FULL_PRACTICE',
        format: 'JSON',
        triggeredBy: 'GDPR',
      });
      const record = r.data.data ?? r.data;
      setHistory((prev) => [record, ...prev]);
      setGdprDone(true);
    } catch {
      // ignore
    } finally {
      setIsGdprExporting(false);
    }
  };

  const handleDownload = (item: ExportRecord) => {
    const url = `/api/exports/${item.id}/download`;
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName ?? 'export';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveSchedule = async () => {
    if (!businessId) return;
    if (!scheduleForm.emailTo.trim()) { setScheduleError('Email is required'); return; }
    if (!scheduleForm.name.trim()) { setScheduleError('Name is required'); return; }
    setIsSavingSchedule(true);
    setScheduleError('');
    try {
      const r = await apiClient.post('/exports/scheduled', {
        businessId,
        ...scheduleForm,
      });
      setSchedules((prev) => [r.data.data ?? r.data, ...prev]);
      setShowAddSchedule(false);
      setScheduleForm({ name: '', exportType: 'APPOINTMENTS', format: 'CSV', frequency: 'WEEKLY', emailTo: '' });
    } catch (err: any) {
      setScheduleError(err.response?.data?.error || 'Failed to save schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleToggleSchedule = async (sched: ScheduledExport) => {
    try {
      await apiClient.patch(`/exports/scheduled/${sched.id}`, { isActive: !sched.isActive });
      setSchedules((prev) => prev.map((s) => s.id === sched.id ? { ...s, isActive: !s.isActive } : s));
    } catch { /* ignore */ }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Delete this scheduled export?')) return;
    try {
      await apiClient.delete(`/exports/scheduled/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
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

  const getTriggeredByLabel = (triggeredBy: string | null) => {
    switch (triggeredBy) {
      case 'SCHEDULED': return <span className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200">Scheduled</span>;
      case 'GDPR': return <span className="px-1.5 py-0.5 text-xs bg-purple-50 text-purple-700 rounded border border-purple-200">GDPR</span>;
      default: return <span className="px-1.5 py-0.5 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200">Manual</span>;
    }
  };

  const isExpired = (item: ExportRecord) => item.expiresAt && new Date(item.expiresAt) < new Date();

  const showsDateFilter = ['APPOINTMENTS', 'INVOICES', 'PAYMENTS', 'TREATMENT_NOTES'].includes(exportType);
  const showsTherapistFilter = ['APPOINTMENTS', 'TREATMENT_NOTES'].includes(exportType);
  const showsStatusFilter = ['APPOINTMENTS', 'INVOICES', 'PAYMENTS'].includes(exportType);
  const showsClientFilter = exportType === 'TREATMENT_NOTES';
  const statusOptions =
    exportType === 'APPOINTMENTS' ? APPOINTMENT_STATUSES :
    exportType === 'INVOICES' ? INVOICE_STATUSES :
    exportType === 'PAYMENTS' ? PAYMENT_STATUSES : [];
  const hasFilters = showsDateFilter || showsTherapistFilter || showsStatusFilter || showsClientFilter;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Data</p>
        <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Exports</h1>
        <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>Export your practice data for analysis, compliance, or backup</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">HIPAA & Compliance</h3>
            <p className="text-sm text-blue-800 mt-0.5">
              All exports include audit logging. Exported files containing PHI should be stored securely. Download links expire after 7 days.
            </p>
          </div>
        </div>
      </div>

      {/* GDPR / Full Data Export */}
      <div className="bg-white rounded-xl border border-purple-200 p-5" style={{ boxShadow: '0 2px 8px rgba(93,74,168,0.08)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Full Data Export (GDPR / Data Portability)</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Download a complete JSON export of all your practice data — clients, appointments, invoices, and treatment notes.
                Use this for GDPR subject access requests or data migration.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-3">
            {gdprDone && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Export ready — see history below
              </span>
            )}
            <button
              onClick={handleGdprExport}
              disabled={isGdprExporting || !businessId}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              style={{ background: '#5D4AA8' }}
            >
              <Archive className="h-4 w-4" />
              {isGdprExporting ? 'Generating...' : 'Export All Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Create One-off Export */}
      <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(93,74,168,0.06)' }}>
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-purple-600" />
          Create One-off Export
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Type</label>
            <select
              value={exportType}
              onChange={(e) => { setExportType(e.target.value); setFilters({ dateFrom: '', dateTo: '', therapistId: '', status: '', clientId: '' }); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {Object.entries(EXPORT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
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
              <option value="JSON">JSON (.json)</option>
              <option value="EXCEL">Excel (.xlsx)</option>
            </select>
            {exportType === 'FULL_PRACTICE' && format === 'PDF' && (
              <p className="text-xs text-amber-600 mt-1">PDF not supported for full exports — CSV will be used</p>
            )}
            {exportType === 'FULL_PRACTICE' && format !== 'PDF' && (
              <p className="text-xs text-gray-400 mt-1">Full export generates a ZIP archive</p>
            )}
          </div>

          <div className="flex items-end gap-2">
            {hasFilters && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-1.5 ${showFilters ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
              </button>
            )}
            <button
              onClick={() => handleCreateExport()}
              disabled={isCreating || !businessId}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
              style={{ background: '#5D4AA8' }}
            >
              {exportType === 'FULL_PRACTICE' ? <Archive className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {isCreating ? 'Creating...' : 'Create Export'}
            </button>
          </div>
        </div>

        {showFilters && hasFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3">
            {showsDateFilter && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </>
            )}
            {showsStatusFilter && statusOptions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All statuses</option>
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {showsTherapistFilter && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Therapist ID</label>
                <input
                  type="text"
                  value={filters.therapistId}
                  onChange={(e) => setFilters((f) => ({ ...f, therapistId: e.target.value }))}
                  placeholder="Leave blank for all"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}
            {showsClientFilter && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client ID</label>
                <input
                  type="text"
                  value={filters.clientId}
                  onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value }))}
                  placeholder="Leave blank for all"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}
          </div>
        )}

        {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
        <p className="mt-3 text-xs text-gray-500">
          Exports are available for download for 7 days. Click Download after creating to get your file.
        </p>
      </div>

      {/* Scheduled Exports */}
      <div className="bg-white rounded-xl border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(93,74,168,0.06)' }}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-600" />
              Scheduled Exports
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Automatically export and email data on a recurring schedule</p>
          </div>
          <button
            onClick={() => { setShowAddSchedule(true); setScheduleError(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg"
            style={{ background: '#5D4AA8' }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Schedule
          </button>
        </div>

        {/* Add schedule form */}
        {showAddSchedule && (
          <div className="p-5 border-b border-gray-100 bg-purple-50/40">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">New Scheduled Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Schedule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Appointments Report"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data Type</label>
                <select
                  value={scheduleForm.exportType}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, exportType: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                >
                  {Object.entries(EXPORT_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Format</label>
                <select
                  value={scheduleForm.format}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, format: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                >
                  <option value="CSV">CSV</option>
                  <option value="JSON">JSON</option>
                  <option value="PDF">PDF</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, frequency: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Send to Email</label>
                <input
                  type="email"
                  placeholder="owner@example.com"
                  value={scheduleForm.emailTo}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, emailTo: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
              </div>
            </div>
            {scheduleError && <p className="text-sm text-red-600 mb-2">{scheduleError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="px-4 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ background: '#5D4AA8' }}
              >
                {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
              </button>
              <button
                onClick={() => { setShowAddSchedule(false); setScheduleError(''); }}
                className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Schedules list */}
        {isLoadingSchedules ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="p-10 text-center">
            <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No scheduled exports yet</p>
            <p className="text-gray-400 text-xs mt-1">Add a schedule to automatically receive exports by email</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {schedules.map((sched) => (
              <div key={sched.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{sched.name}</span>
                    {!sched.isActive && (
                      <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">Paused</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {EXPORT_TYPE_LABELS[sched.exportType] ?? sched.exportType}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{sched.format}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-purple-600 font-medium">{FREQ_LABELS[sched.frequency]}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500 truncate max-w-[180px]">{sched.emailTo}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {sched.lastRunAt && (
                      <span className="text-xs text-gray-400">
                        Last run: {new Date(sched.lastRunAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Next: {new Date(sched.nextRunAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleSchedule(sched)}
                    title={sched.isActive ? 'Pause' : 'Resume'}
                    className="text-gray-400 hover:text-purple-600"
                  >
                    {sched.isActive
                      ? <ToggleRight className="h-5 w-5 text-purple-600" />
                      : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(sched.id)}
                    className="text-gray-300 hover:text-red-500 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export History */}
      <div className="bg-white rounded-xl border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(93,74,168,0.06)' }}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Export History
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Last 50 exports · Download links expire after 7 days</p>
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
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggered By</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoadingHistory && (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</td></tr>
              )}
              {!isLoadingHistory && history.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No exports yet</p>
                    <p className="text-gray-400 text-xs mt-1">Create your first export above</p>
                  </td>
                </tr>
              )}
              {history.map((item) => {
                const expired = isExpired(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-900 font-medium">
                      {EXPORT_TYPE_LABELS[item.exportType] ?? item.exportType}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                      {item.exportType === 'FULL_PRACTICE' ? 'ZIP' : item.format}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-[180px] truncate">{item.fileName || '—'}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">{item.rowCount?.toLocaleString() ?? '—'}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">{getTriggeredByLabel(item.triggeredBy)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-xs">
                      {new Date(item.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                      {item.expiresAt ? (
                        expired
                          ? <span className="text-red-400">Expired</span>
                          : <span className="text-gray-500">{new Date(item.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {item.status === 'COMPLETED' && !expired ? (
                        <button
                          onClick={() => handleDownload(item)}
                          className="text-purple-600 hover:text-purple-800 font-medium text-xs flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
