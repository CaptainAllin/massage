'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import { Plus, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal';
import { useInvoices, useInvoiceStats, useCreateInvoice } from '@/lib/hooks/use-invoices';
import { CreateInvoiceDto } from '@massage/types';
import { useClients } from '@/lib/hooks/use-clients';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function InvoicesPage() {
  const businessId = useBusinessId();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: invoicesData } = useInvoices(businessId, {});
  const { data: stats } = useInvoiceStats(businessId);
  const createMutation = useCreateInvoice(businessId);
  const { data: clientsData } = useClients(businessId);

  const handleCreateInvoice = async (data: CreateInvoiceDto) => {
    await createMutation.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Invoices</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage client invoices
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${stats.totalInvoiced.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stats.invoiceCount} invoices</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${stats.totalPaid.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stats.paidCount} invoices</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${stats.totalOverdue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stats.overdueCount} invoices</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice List */}
      <Card>
        <CardContent className="p-6">
          <InvoiceList
            invoices={invoicesData?.data || []}
            totalPages={invoicesData?.meta?.totalPages || 0}
            currentPage={invoicesData?.meta?.page || 1}
            onPageChange={() => {}}
          />
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateInvoice}
        businessId={businessId!}
        clients={(clientsData || []).map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName }))}
      />
    </div>
  );
}
