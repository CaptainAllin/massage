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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
            Treatment Notes
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2">SOAP notes and treatment documentation</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/treatment-notes/new')}>
          New SOAP Note
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
