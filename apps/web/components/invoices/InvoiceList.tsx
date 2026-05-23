'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Table, Column, Badge, Pagination } from '@massage/ui';
import { Invoice, InvoiceStatus } from '@massage/types';

export interface InvoiceListProps {
  invoices: Invoice[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case InvoiceStatus.PAID:
      return 'success';
    case InvoiceStatus.SENT:
    case InvoiceStatus.PARTIALLY_PAID:
      return 'warning';
    case InvoiceStatus.OVERDUE:
      return 'danger';
    case InvoiceStatus.DRAFT:
    case InvoiceStatus.CANCELLED:
      return 'default';
    default:
      return 'default';
  }
};

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  totalPages,
  currentPage,
  onPageChange,
}) => {
  const router = useRouter();

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      render: (invoice) => invoice.invoiceNumber,
    },
    {
      key: 'client',
      header: 'Client',
      render: (invoice) => {
        const client = (invoice as any).client;
        if (!client) return '-';
        return `${client.firstName} ${client.lastName}`;
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (invoice) => new Date(invoice.createdAt).toLocaleDateString(),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (invoice) => `$${invoice.total.toFixed(2)}`,
    },
    {
      key: 'amountDue',
      header: 'Amount Due',
      render: (invoice) => `$${invoice.amountDue.toFixed(2)}`,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (invoice) => {
        if (!invoice.dueDate) return '-';
        return new Date(invoice.dueDate).toLocaleDateString();
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (invoice) => (
        <Badge variant={getStatusVariant(invoice.status)}>
          {invoice.status.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  const handleRowClick = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <div className="space-y-4">
      <Table
        data={invoices}
        columns={columns}
        onRowClick={handleRowClick}
        emptyMessage="No invoices found"
      />
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
