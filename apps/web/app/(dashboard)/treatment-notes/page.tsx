'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, SearchInput, Table, Column, Skeleton } from '@massage/ui';
import { useTreatmentNotes } from '@/lib/hooks';
import { TreatmentNote } from '@massage/types';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function TreatmentNotesPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const [search, setSearch] = useState('');

  const { data: notesData, isLoading } = useTreatmentNotes(businessId);
  const notes = notesData?.data || [];

  const columns: Column<any>[] = [
    {
      key: 'client',
      header: 'Client',
      render: (note) =>
        note.client ? `${note.client.firstName} ${note.client.lastName}` : '-',
    },
    {
      key: 'therapist',
      header: 'Therapist',
      render: (note) =>
        note.therapist?.user
          ? `${note.therapist.user.firstName} ${note.therapist.user.lastName}`
          : '-',
    },
    {
      key: 'appointment',
      header: 'Appointment Date',
      sortable: true,
      render: (note) =>
        note.appointment
          ? new Date(note.appointment.startTime).toLocaleDateString()
          : '-',
    },
    {
      key: 'sessionDuration',
      header: 'Duration',
      render: (note) => (note.sessionDuration ? `${note.sessionDuration} min` : '-'),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (note) => new Date(note.createdAt).toLocaleDateString(),
    },
  ];

  const handleRowClick = (note: TreatmentNote) => {
    router.push(`/treatment-notes/${note.id}`);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Practice</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>
            Treatment Notes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>SOAP notes and treatment documentation</p>
        </div>
        <Button size="sm" variant="primary" onClick={() => router.push('/treatment-notes/new')}>
          + New SOAP Note
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        placeholder="Search treatment notes..."
      />

      {isLoading ? (
        <Skeleton variant="rectangular" height={400} />
      ) : (
        <Table
          data={notes}
          columns={columns}
          onRowClick={handleRowClick}
          emptyMessage="No treatment notes found. Create your first SOAP note to get started."
        />
      )}
    </div>
  );
}
