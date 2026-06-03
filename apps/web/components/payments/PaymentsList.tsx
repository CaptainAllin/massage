'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Table, Column, Badge, Pagination } from '@massage/ui';
import { Payment, PaymentStatus, PaymentMethod } from '@massage/types';

export interface PaymentsListProps {
  payments: Payment[];
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  onFilterChange?: (filters: any) => void;
}

const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return 'success';
    case PaymentStatus.PENDING:
    case PaymentStatus.PROCESSING:
      return 'warning';
    case PaymentStatus.FAILED:
      return 'danger';
    case PaymentStatus.REFUNDED:
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'default';
    default:
      return 'default';
  }
};

const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case PaymentMethod.STRIPE_CARD:
      return 'Card';
    case PaymentMethod.CASH:
      return 'Cash';
    case PaymentMethod.CHEQUE:
      return 'Cheque';
    case PaymentMethod.BANK_TRANSFER:
      return 'Bank Transfer';
    default:
      return method;
  }
};

export const PaymentsList: React.FC<PaymentsListProps> = ({
  payments,
  totalPages = 0,
  currentPage = 1,
  onPageChange = () => {},
  isLoading = false,
}) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #EFE9F2', overflow: 'hidden', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 18, height: 18, border: '2px solid #5D4AA8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: '#7A7090' }}>Loading payments…</span>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 48, background: '#F7F4FB', borderRadius: 10, opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      </div>
    );
  }

  const columns: Column<Payment>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (payment) => new Date(payment.createdAt).toLocaleDateString(),
    },
    {
      key: 'client',
      header: 'Client',
      render: (payment) => {
        const client = (payment as any).client;
        if (!client) return '-';
        return `${client.firstName} ${client.lastName}`;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (payment) => {
        const amount = payment.amount - (payment.refundedAmount || 0);
        return `$${amount.toFixed(2)} ${payment.currency}`;
      },
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (payment) => formatPaymentMethod(payment.paymentMethod),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment) => (
        <Badge variant={getStatusVariant(payment.status)}>
          {payment.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (payment) => payment.description || '-',
    },
  ];

  const handleRowClick = (payment: Payment) => {
    router.push(`/payments/${payment.id}`);
  };

  return (
    <div className="space-y-4">
      <Table
        data={payments}
        columns={columns}
        onRowClick={handleRowClick}
        emptyMessage="No payments found"
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
