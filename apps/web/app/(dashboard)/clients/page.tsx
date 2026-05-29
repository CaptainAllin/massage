'use client';

import { useState } from 'react';
import { useClientsWithMeta, ClientFilterType } from '@/lib/hooks/use-clients';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { AddClientModal } from '@/components/clients/AddClientModal';
import { ImportClientsModal } from '@/components/clients/ImportClientsModal';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

function buildCounts(counts: { all: number; vip: number; newThisMonth: number; dueForVisit: number; inactive60d: number } | undefined) {
  return {
    all: counts?.all ?? 0,
    vip: counts?.vip ?? 0,
    new: counts?.newThisMonth ?? 0,
    due: counts?.dueForVisit ?? 0,
    inactive: counts?.inactive60d ?? 0,
  };
}

const FILTERS: { key: ClientFilterType; label: string; countKey: 'all' | 'vip' | 'new' | 'due' | 'inactive' }[] = [
  { key: 'all', label: 'All', countKey: 'all' },
  { key: 'vip', label: 'VIP', countKey: 'vip' },
  { key: 'new', label: 'New this month', countKey: 'new' },
  { key: 'due', label: 'Due for visit', countKey: 'due' },
  { key: 'inactive', label: 'Inactive 60d+', countKey: 'inactive' },
];

export default function ClientsPage() {
  const businessId = useBusinessId();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ClientFilterType>('all');

  const { data: result, isLoading } = useClientsWithMeta(businessId, {
    search: search || undefined,
    page: currentPage,
    limit: 20,
    filter: activeFilter,
  });

  const counts = buildCounts(result?.counts);

  const clients = result?.data ?? [];
  const meta = result?.meta;

  function handleFilterChange(filter: ClientFilterType) {
    setActiveFilter(filter);
    setCurrentPage(1);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    setCurrentPage(1);
  }

  return (
    <div style={{ padding: '24px 28px 32px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.4px',
              color: '#5D4AA8',
              marginBottom: 4,
              margin: '0 0 4px 0',
            }}
          >
            Clients · {counts.all > 0 ? `${counts.all.toLocaleString()} active` : '—'}
          </p>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#1E1830',
              letterSpacing: '-0.4px',
              margin: '0 0 4px 0',
            }}
          >
            Your people
          </h1>
          <p style={{ fontSize: 13, color: '#7A7090', margin: 0 }}>
            {counts.new > 0 ? `${counts.new} new clients this month` : 'No new clients this month'}
            {counts.due > 0 ? ` · ${counts.due} are due for a follow-up.` : '.'}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setIsImportModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid #E5DEEC',
              background: '#fff',
              fontSize: 13,
              fontWeight: 500,
              color: '#3D3450',
              cursor: 'pointer',
            }}
          >
            <ArrowUpTrayIcon style={{ width: 15, height: 15 }} />
            Import
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid #E5DEEC',
              background: '#fff',
              fontSize: 13,
              fontWeight: 500,
              color: '#3D3450',
              cursor: 'pointer',
            }}
          >
            <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
            Export
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 16px #5D4AA844',
            }}
          >
            <PlusIcon style={{ width: 15, height: 15 }} />
            Add client
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #EFE9F2',
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* Search pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 36,
            borderRadius: 999,
            border: '1px solid #E5DEEC',
            background: '#FAFAF9',
            padding: '0 12px',
            minWidth: 220,
            flex: '1 1 220px',
            maxWidth: 320,
          }}
        >
          <MagnifyingGlassIcon style={{ width: 15, height: 15, color: '#7A7090', flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search clients…"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 13,
              color: '#1E1830',
              width: '100%',
            }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const count = counts[f.countKey];
            return (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 13px',
                  borderRadius: 999,
                  border: isActive ? 'none' : '1px solid #E5DEEC',
                  background: isActive ? 'linear-gradient(135deg, #5D4AA8, #3F2F87)' : 'transparent',
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : '#3D3450',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 2px 8px #5D4AA833' : 'none',
                }}
              >
                {f.label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: isActive ? 'rgba(255,255,255,0.22)' : '#EDE5F4',
                    color: isActive ? '#fff' : '#5D4AA8',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* More filters */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginLeft: 'auto',
            padding: '6px 13px',
            borderRadius: 999,
            border: '1px solid #E5DEEC',
            background: 'transparent',
            fontSize: 12.5,
            fontWeight: 500,
            color: '#3D3450',
            cursor: 'pointer',
          }}
        >
          <FunnelIcon style={{ width: 13, height: 13 }} />
          More filters
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #EFE9F2', overflow: 'hidden', padding: '16px' }}>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 52, background: '#F7F4FB', borderRadius: 10, opacity: 1 - i * 0.08 }} />
            ))}
          </div>
        </div>
      ) : (
        <ClientsTable
          clients={clients}
          totalPages={meta?.totalPages ?? 1}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          total={meta?.total}
          onAddClient={() => setIsAddModalOpen(true)}
        />
      )}

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        businessId={businessId}
      />

      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        businessId={businessId}
      />
    </div>
  );
}
