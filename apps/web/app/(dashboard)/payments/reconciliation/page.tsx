'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@massage/ui';
import { ArrowLeft, AlertTriangle, CreditCard, FileText, CheckSquare } from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useReconciliation } from '@/lib/hooks/use-payments';

function fmt(n: number) {
  return `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReconciliationPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const { data, isLoading } = useReconciliation(businessId);
  const [activeTab, setActiveTab] = useState<'unmatched' | 'overdue' | 'partial'>('overdue');

  const summary = data?.summary ?? {};
  const unmatchedPayments: any[] = data?.unmatchedPayments ?? [];
  const overdueInvoices: any[] = data?.overdueInvoices ?? [];
  const partialPayments: any[] = data?.partialPayments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Payment Reconciliation</h1>
          <p className="text-muted-foreground mt-1">Identify and resolve payment discrepancies</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Overdue Invoices"
          count={summary.overdueInvoicesCount ?? 0}
          amount={summary.overdueAmount ?? 0}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          color="text-red-600"
          active={activeTab === 'overdue'}
          onClick={() => setActiveTab('overdue')}
        />
        <SummaryCard
          label="Partial Payments"
          count={summary.partialPaymentsCount ?? 0}
          amount={summary.partialAmount ?? 0}
          icon={<FileText className="h-5 w-5 text-orange-500" />}
          color="text-orange-600"
          active={activeTab === 'partial'}
          onClick={() => setActiveTab('partial')}
        />
        <SummaryCard
          label="Unmatched Payments"
          count={summary.unmatchedPaymentsCount ?? 0}
          amount={summary.unmatchedPaymentsAmount ?? 0}
          icon={<CreditCard className="h-5 w-5 text-blue-500" />}
          color="text-blue-600"
          active={activeTab === 'unmatched'}
          onClick={() => setActiveTab('unmatched')}
        />
      </div>

      {/* Tab content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading reconciliation data…</p>
          ) : (
            <>
              {activeTab === 'overdue' && (
                <>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Overdue Invoices ({overdueInvoices.length})
                  </h3>
                  {overdueInvoices.length === 0 ? (
                    <AllClearMessage message="No overdue invoices" />
                  ) : (
                    <ReconciliationTable
                      rows={overdueInvoices.map((inv) => ({
                        id: inv.id,
                        label: inv.invoiceNumber,
                        client: `${inv.client.firstName} ${inv.client.lastName}`,
                        amount: inv.amountDue,
                        date: inv.dueDate ? `Due: ${new Date(inv.dueDate).toLocaleDateString()}` : '',
                        badge: <Badge variant="danger">OVERDUE</Badge>,
                        link: `/invoices/${inv.id}`,
                      }))}
                      onNavigate={(link) => router.push(link)}
                    />
                  )}
                </>
              )}

              {activeTab === 'partial' && (
                <>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    Partially Paid Invoices ({partialPayments.length})
                  </h3>
                  {partialPayments.length === 0 ? (
                    <AllClearMessage message="No partially paid invoices" />
                  ) : (
                    <ReconciliationTable
                      rows={partialPayments.map((inv) => ({
                        id: inv.id,
                        label: inv.invoiceNumber,
                        client: `${inv.client.firstName} ${inv.client.lastName}`,
                        amount: inv.amountDue,
                        date: `Paid: ${fmt(inv.amountPaid)} of ${fmt(inv.total)}`,
                        badge: <Badge variant="warning">PARTIAL</Badge>,
                        link: `/invoices/${inv.id}`,
                      }))}
                      onNavigate={(link) => router.push(link)}
                    />
                  )}
                </>
              )}

              {activeTab === 'unmatched' && (
                <>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Payments Without Invoice ({unmatchedPayments.length})
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    These payments were completed but are not linked to any invoice.
                  </p>
                  {unmatchedPayments.length === 0 ? (
                    <AllClearMessage message="All payments are matched to invoices" />
                  ) : (
                    <ReconciliationTable
                      rows={unmatchedPayments.map((p) => ({
                        id: p.id,
                        label: p.paymentMethod,
                        client: `${p.client.firstName} ${p.client.lastName}`,
                        amount: p.amount,
                        date: p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '',
                        badge: <Badge variant="default">NO INVOICE</Badge>,
                        link: `/payments/${p.id}`,
                      }))}
                      onNavigate={(link) => router.push(link)}
                    />
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label, count, amount, icon, color, active, onClick,
}: {
  label: string; count: number; amount: number; icon: React.ReactNode;
  color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
        active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm font-medium text-gray-700">{label}</span></div>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-sm text-gray-500 mt-1">{`$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding`}</p>
    </button>
  );
}

function ReconciliationTable({
  rows, onNavigate,
}: {
  rows: Array<{ id: string; label: string; client: string; amount: number; date: string; badge: React.ReactNode; link: string }>;
  onNavigate: (link: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-semibold text-gray-600">Reference</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">Client</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">Details</th>
            <th className="text-right py-2 px-3 font-semibold text-gray-600">Amount Due</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onNavigate(row.link)}
            >
              <td className="py-2 px-3 font-medium text-blue-600">{row.label}</td>
              <td className="py-2 px-3 text-gray-700">{row.client}</td>
              <td className="py-2 px-3 text-gray-500">{row.date}</td>
              <td className="py-2 px-3 text-right font-semibold text-red-600">
                {`$${row.amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </td>
              <td className="py-2 px-3">{row.badge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllClearMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 py-6 text-green-600">
      <CheckSquare className="h-6 w-6" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
