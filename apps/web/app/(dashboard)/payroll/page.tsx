'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import {
  DollarSign,
  Calendar,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  usePayrollPeriods,
  useCreatePayrollPeriod,
  useUpdatePayrollPeriod,
  useDeletePayrollPeriod,
  useUpdatePayrollRecord,
} from '@/lib/hooks/use-payroll';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-[#EFE9F2] text-[#7A7090]',
  PROCESSING: 'bg-[#F7E5DD] text-[#C97E68]',
  PAID: 'bg-[#EDE5F4] text-[#5D4AA8]',
  CANCELLED: 'bg-red-100 text-red-700',
};

function NewPeriodModal({ businessId, onClose }: { businessId: string; onClose: () => void }) {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [form, setForm] = useState({ startDate: firstOfMonth, endDate: lastOfMonth, notes: '' });
  const create = useCreatePayrollPeriod(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Generate Payroll Period</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. May 2026 payroll"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg p-3">
              Payroll records are auto-generated from completed appointments in the selected period. Commission defaults to 30% of session revenue.
            </p>
            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {create.isPending ? 'Generating...' : 'Generate Payroll'}
              </Button>
              <Button type="button" onClick={onClose} variant="outline">Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EditRecordModal({
  businessId, periodId, record, onClose,
}: { businessId: string; periodId: string; record: any; onClose: () => void }) {
  const [form, setForm] = useState({
    bonusAmount: record.bonusAmount,
    deductions: record.deductions,
    commissionRate: record.commissionRate * 100,
    notes: record.notes ?? '',
  });
  const update = useUpdatePayrollRecord(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await update.mutateAsync({
      periodId,
      recordId: record.id,
      bonusAmount: parseFloat(String(form.bonusAmount)),
      deductions: parseFloat(String(form.deductions)),
      commissionRate: parseFloat(String(form.commissionRate)) / 100,
      notes: form.notes,
    });
    onClose();
  };

  const name = `${record.therapist?.user?.firstName} ${record.therapist?.user?.lastName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-1">Edit Record — {name}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {record.sessionsCompleted} sessions · {record.hoursWorked.toFixed(1)}h
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Commission %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bonus ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.bonusAmount}
                  onChange={(e) => setForm({ ...form, bonusAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deductions ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.deductions}
                  onChange={(e) => setForm({ ...form, deductions: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={update.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {update.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" onClick={onClose} variant="outline">Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PayrollPeriodCard({ period, businessId }: { period: any; businessId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const updatePeriod = useUpdatePayrollPeriod(businessId);
  const deletePeriod = useDeletePayrollPeriod(businessId);

  const startLabel = new Date(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = new Date(period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleMarkPaid = async () => {
    await updatePeriod.mutateAsync({ id: period.id, status: 'PAID', paidAt: new Date().toISOString() });
  };

  const handleExport = (format: string) => {
    window.open(`/api/payroll/${period.id}/export?format=${format}`, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this payroll period?')) return;
    await deletePeriod.mutateAsync(period.id);
  };

  return (
    <>
      {editRecord && (
        <EditRecordModal
          businessId={businessId}
          periodId={period.id}
          record={editRecord}
          onClose={() => setEditRecord(null)}
        />
      )}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div>
                <p className="font-medium">{startLabel} – {endLabel}</p>
                <p className="text-sm text-muted-foreground">
                  {period.records.length} therapist{period.records.length !== 1 ? 's' : ''} · Total: ${period.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[period.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {period.status}
              </span>
              <div className="flex gap-1">
                {period.status === 'DRAFT' && (
                  <Button
                    onClick={handleMarkPaid}
                    disabled={updatePeriod.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Mark Paid
                  </Button>
                )}
                <Button onClick={() => handleExport('csv')} size="sm" variant="outline" title="Export CSV">
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
                <Button onClick={() => handleExport('quickbooks')} size="sm" variant="outline" title="Export IIF for QuickBooks">
                  QB
                </Button>
                {period.status !== 'PAID' && (
                  <Button onClick={handleDelete} size="sm" variant="outline" className="text-red-500 hover:text-red-700" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 border-t border-border pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground text-xs border-b border-border">
                    <th className="pb-2">Therapist</th>
                    <th className="pb-2 text-right">Hours</th>
                    <th className="pb-2 text-right">Sessions</th>
                    <th className="pb-2 text-right">Base Pay</th>
                    <th className="pb-2 text-right">Commission</th>
                    <th className="pb-2 text-right">Bonus</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {period.records.map((record: any) => (
                    <tr key={record.id} className="py-2">
                      <td className="py-2 font-medium">
                        {record.therapist?.user?.firstName} {record.therapist?.user?.lastName}
                      </td>
                      <td className="py-2 text-right">{record.hoursWorked.toFixed(1)}</td>
                      <td className="py-2 text-right">{record.sessionsCompleted}</td>
                      <td className="py-2 text-right">${(record.baseRate * record.hoursWorked).toFixed(2)}</td>
                      <td className="py-2 text-right">${record.commissionAmount.toFixed(2)} <span className="text-muted-foreground text-xs">({(record.commissionRate * 100).toFixed(0)}%)</span></td>
                      <td className="py-2 text-right">${record.bonusAmount.toFixed(2)}</td>
                      <td className="py-2 text-right font-semibold">${record.totalAmount.toFixed(2)}</td>
                      <td className="py-2 pl-2">
                        {period.status !== 'PAID' && (
                          <button onClick={() => setEditRecord(record)} className="text-muted-foreground hover:text-primary">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-sm">
                    <td className="pt-3 border-t border-border" colSpan={6}>Total</td>
                    <td className="pt-3 border-t border-border text-right">${period.totalAmount.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              {period.notes && (
                <p className="text-xs text-muted-foreground mt-3 bg-muted/50 rounded px-2 py-1">{period.notes}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function PayrollPage() {
  const businessId = useBusinessId();
  const { data, isLoading } = usePayrollPeriods(businessId);
  const [showModal, setShowModal] = useState(false);

  const periods = data?.periods ?? [];
  const totalPaid = periods.filter((p: any) => p.status === 'PAID').reduce((s: number, p: any) => s + p.totalAmount, 0);
  const pendingPeriods = periods.filter((p: any) => p.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      {showModal && businessId && (
        <NewPeriodModal businessId={businessId} onClose={() => setShowModal(false)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-muted-foreground text-sm mt-1">Therapist hours, commissions, and pay stubs</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Generate Payroll
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Paid (All Time)', value: `$${totalPaid.toFixed(2)}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Pending Periods', value: String(pendingPeriods), icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Total Periods', value: String(periods.length), icon: Calendar, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payroll Periods */}
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading payroll data...</p>}
        {!isLoading && periods.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No payroll periods yet</p>
            <p className="text-sm mt-1">Generate your first payroll period to get started</p>
          </div>
        )}
        {periods.map((period: any) => (
          <PayrollPeriodCard key={period.id} period={period} businessId={businessId!} />
        ))}
      </div>

      {/* Notes */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold mb-2 text-sm">Accounting Export</h2>
          <p className="text-xs text-muted-foreground">
            Export payroll periods as <strong>CSV</strong> for spreadsheet import, or as <strong>QuickBooks IIF</strong> format for direct import into QuickBooks Desktop.
            For Xero or other accounting software, use the CSV export and map columns in your accounting tool.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
