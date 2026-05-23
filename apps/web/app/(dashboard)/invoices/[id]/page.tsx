'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Skeleton, Badge, Tabs, Tab } from '@massage/ui';
import { ArrowLeft, Edit, Trash2, DollarSign, Download, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  useInvoice,
  useDeleteInvoice,
  useMarkInvoiceAsPaid,
  useSendInvoice,
  useSendInvoiceSms,
} from '@/lib/hooks/use-invoices';
import { InvoiceLineItemsTable } from '@/components/invoices/InvoiceLineItemsTable';
import { InvoiceStatus } from '@massage/types';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const businessId = useBusinessId();

  const { data: invoice, isLoading } = useInvoice(invoiceId, businessId);
  const deleteMutation = useDeleteInvoice(businessId);
  const markPaidMutation = useMarkInvoiceAsPaid(businessId);
  const sendMutation = useSendInvoice(businessId);
  const sendSmsMutation = useSendInvoiceSms(businessId);

  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [showSendMenu, setShowSendMenu] = useState(false);
  const sendMenuRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const handleMarkAsPaid = async () => {
    await markPaidMutation.mutateAsync(invoiceId);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await deleteMutation.mutateAsync(invoiceId);
      router.push('/invoices');
    }
  };

  const handleSendInvoice = async () => {
    try {
      await sendMutation.mutateAsync(invoiceId);
      alert('Invoice sent via email successfully!');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to send invoice');
    }
  };

  const handleSendSms = async (channel: 'SMS' | 'WHATSAPP') => {
    setShowSendMenu(false);
    try {
      await sendSmsMutation.mutateAsync({ invoiceId, channel });
      alert(`Invoice sent via ${channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} successfully!`);
    } catch (err: any) {
      alert(err?.response?.data?.error || `Failed to send invoice via ${channel}`);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    const lineItems = (invoice.lineItems as any[]) ?? [];
    const lineRows = lineItems
      .map(
        (li) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${li.description}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${li.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">$${li.unitPrice?.toFixed(2)}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">$${li.total?.toFixed(2)}</td></tr>`,
      )
      .join('');

    const dueStr = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString()
      : 'On receipt';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;margin:40px}
      h1{font-size:28px;font-weight:700;margin-bottom:4px}
      .meta{color:#666;font-size:13px;margin-bottom:32px}
      table{width:100%;border-collapse:collapse;font-size:14px}
      th{text-align:left;padding:8px 12px;background:#f9f9f9;font-weight:600;border-bottom:2px solid #e5e5e5}
      th.right{text-align:right}th.center{text-align:center}
      .totals{margin-top:16px;text-align:right;font-size:14px}
      .totals p{margin:4px 0}
      .total-due{font-size:20px;font-weight:700;margin-top:8px}
      @media print{body{margin:20px}}
    </style></head><body>
      <h1>Invoice ${invoice.invoiceNumber}</h1>
      <p class="meta">Due: ${dueStr}</p>
      <table>
        <tr><th>Description</th><th class="center">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr>
        ${lineRows}
      </table>
      <div class="totals">
        ${invoice.taxAmount > 0 ? `<p>Tax: $${invoice.taxAmount.toFixed(2)}</p>` : ''}
        ${invoice.discountAmount > 0 ? `<p>Discount: -$${invoice.discountAmount.toFixed(2)}</p>` : ''}
        <p>Total: $${invoice.total.toFixed(2)}</p>
        <p class="total-due">Amount Due: $${invoice.amountDue.toFixed(2)}</p>
      </div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const tabs: Tab[] = [
    { id: 'details', label: 'Details' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              Client #{invoice.clientId}
            </p>
          </div>
          <StatusBadge status={invoice.status as InvoiceStatus} />
        </div>
        <div className="flex gap-2">
          {invoice.status !== InvoiceStatus.PAID && (
            <Button variant="primary" onClick={handleMarkAsPaid}>
              <DollarSign className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
          <Button variant="outline" onClick={handleSendInvoice} disabled={sendMutation.isPending}>
            <Send className="h-4 w-4 mr-2" />
            {sendMutation.isPending ? 'Sending…' : 'Send Email'}
          </Button>
          <div className="relative" ref={sendMenuRef}>
            <Button
              variant="outline"
              onClick={() => setShowSendMenu((v) => !v)}
              disabled={sendSmsMutation.isPending}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {sendSmsMutation.isPending ? 'Sending…' : 'Send SMS'}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            {showSendMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => handleSendSms('SMS')}
                >
                  Send via SMS
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => handleSendSms('WHATSAPP')}
                >
                  Send via WhatsApp
                </button>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Invoice Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Invoice Number" value={invoice.invoiceNumber} />
                  <InfoRow label="Status" value={<StatusBadge status={invoice.status as InvoiceStatus} />} />
                  {invoice.issuedAt && <InfoRow label="Issue Date" value={new Date(invoice.issuedAt).toLocaleDateString()} />}
                  {invoice.dueDate && <InfoRow label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString()} />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Line Items</h3>
                <InvoiceLineItemsTable
                  lineItems={invoice.lineItems || []}
                  readOnly={!isEditing}
                />
              </CardContent>
            </Card>
          </div>

          {/* Totals */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Summary</h3>
                <div className="space-y-3">
                  <SummaryRow label="Subtotal" value={`$${invoice.subtotal.toFixed(2)}`} />
                  {invoice.taxAmount > 0 && (
                    <SummaryRow label="Tax" value={`$${invoice.taxAmount.toFixed(2)}`} />
                  )}
                  {invoice.discountAmount > 0 && (
                    <SummaryRow label="Discount" value={`-$${invoice.discountAmount.toFixed(2)}`} />
                  )}
                  <div className="border-t pt-3">
                    <SummaryRow
                      label="Total"
                      value={`$${invoice.total.toFixed(2)}`}
                      isTotal
                    />
                  </div>
                  {invoice.amountPaid > 0 && (
                    <>
                      <SummaryRow
                        label="Amount Paid"
                        value={`$${invoice.amountPaid.toFixed(2)}`}
                      />
                      <SummaryRow
                        label="Amount Due"
                        value={`$${invoice.amountDue.toFixed(2)}`}
                        isTotal
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Invoice Timeline</h3>
            <div className="space-y-4">
              <TimelineItem
                title="Invoice Created"
                date={new Date(invoice.createdAt)}
              />
              {invoice.sentAt && (
                <TimelineItem
                  title="Invoice Sent"
                  date={new Date(invoice.sentAt)}
                />
              )}
              {invoice.paidAt && (
                <TimelineItem
                  title="Invoice Paid"
                  date={new Date(invoice.paidAt)}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <div className="text-sm text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value, isTotal = false }: { label: string; value: string; isTotal?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={`text-sm ${isTotal ? 'font-bold' : 'font-medium'} text-gray-600`}>
        {label}
      </span>
      <span className={`text-sm ${isTotal ? 'font-bold text-lg' : ''} text-gray-900`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const variants: Record<InvoiceStatus, 'success' | 'warning' | 'danger' | 'default'> = {
    [InvoiceStatus.DRAFT]: 'default',
    [InvoiceStatus.SENT]: 'warning',
    [InvoiceStatus.PAID]: 'success',
    [InvoiceStatus.OVERDUE]: 'danger',
    [InvoiceStatus.CANCELLED]: 'default',
    [InvoiceStatus.PARTIALLY_PAID]: 'warning',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}

function TimelineItem({ title, date }: { title: string; date: Date }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{date.toLocaleString()}</p>
      </div>
    </div>
  );
}
