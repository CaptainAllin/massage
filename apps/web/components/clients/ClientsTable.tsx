'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Column, Pagination, Badge } from '@massage/ui';
import { Client } from '@massage/types';

export interface ClientsTableProps {
  clients: Client[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  totalPages,
  currentPage,
  onPageChange,
}) => {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (client) => `${client.firstName} ${client.lastName}`,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (client) => client.email || '-',
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (client) => client.phoneNumber || '-',
    },
    {
      key: 'totalVisits',
      header: 'Visits',
      sortable: true,
      render: (client) => client.totalVisits || 0,
    },
    {
      key: 'lastVisitDate',
      header: 'Last Visit',
      sortable: true,
      render: (client) => {
        if (!client.lastVisitDate) return '-';
        return new Date(client.lastVisitDate).toLocaleDateString();
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (client) => (
        <Badge variant={client.isActive ? 'success' : 'default'}>
          {client.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const handleRowClick = (client: Client) => {
    router.push(`/clients/${client.id}`);
  };

  return (
    <div className="space-y-4">
      <Table
        data={clients}
        columns={columns}
        onSort={handleSort}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onRowClick={handleRowClick}
        emptyMessage="No clients found. Create your first client to get started."
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
