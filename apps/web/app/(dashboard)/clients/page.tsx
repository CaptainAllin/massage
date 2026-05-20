'use client';

import { useState } from 'react';
import { Button, SearchInput, Skeleton } from '@massage/ui';
import { useClients } from '@/lib/hooks';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { AddClientModal } from '@/components/clients/AddClientModal';

export default function ClientsPage() {
  const businessId = 'temp-business-id'; // TODO: Get from auth context
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: clients, isLoading } = useClients(businessId, {
    search,
    page: currentPage,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Clients</h1>
          <p className="text-muted-foreground mt-2">
            Manage your client profiles and history
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          Add Client
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search clients by name, email, or phone..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton variant="rectangular" height={60} count={5} />
        </div>
      ) : (
        <ClientsTable
          clients={clients || []}
          totalPages={1}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        businessId={businessId}
      />
    </div>
  );
}
