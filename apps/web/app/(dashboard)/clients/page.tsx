'use client';

import { useState } from 'react';
import { Button, SearchInput, Skeleton } from '@massage/ui';
import { useClients } from '@/lib/hooks';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { AddClientModal } from '@/components/clients/AddClientModal';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function ClientsPage() {
  const businessId = useBusinessId();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: clients, isLoading } = useClients(businessId, {
    search,
    page: currentPage,
    limit: 20,
  });

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>
            Clients
          </p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>
            Your People
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
            Manage your client profiles and history
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => setIsAddModalOpen(true)}>
          + Add Client
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
