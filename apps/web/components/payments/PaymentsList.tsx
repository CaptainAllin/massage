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
    case PaymentMethod.CHECK:
      return 'Check';
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
}) => {
  const router = useRouter();

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
