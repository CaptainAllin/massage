'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, SearchInput, Table, Column, Skeleton } from '@massage/ui';
import { useTreatmentNotes } from '@/lib/hooks';
import { TreatmentNote } from '@massage/types';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { TreatmentNotesTour } from '@/components/treatment-notes/TreatmentNotesTour';
import { NoteStatusBadge } from '@/components/treatment-notes/NoteStatusBadge';

type Tab = 'all' | 'pending';

export default function TreatmentNotesPage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  const { data: allNotesData, isLoading: allLoading } = useTreatmentNotes(businessId);
  const { data: pendingData, isLoading: pendingLoading } = useTreatmentNotes(businessId, {
    status: 'PENDING_REVIEW',
  });

  const isLoading = tab === 'all' ? allLoading : pendingLoading;
  const rawNotes = tab === 'all'
    ? (allNotesData?.data || [])
    : (pendingData?.data || []);

  const notes = search
    ? rawNotes.filter((n: any) => {
        const clientName = `${n.client?.firstName ?? ''} ${n.client?.lastName ?? ''}`.toLowerCase();
        const therapistName = `${n.therapist?.user?.firstName ?? ''} ${n.therapist?.user?.lastName ?? ''}`.toLowerCase();
        return clientName.includes(search.toLowerCase()) || therapistName.includes(search.toLowerCase());
      })
    : rawNotes;

  const pendingCount = pendingData?.data?.length ?? 0;

  const columns: Column<any>[] = [
    {
      key: 'status',
      header: 'Status',
      render: (note) => <NoteStatusBadge status={note.status ?? 'DRAFT'} />,
    },
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
      key: 'noteTemplateName',
      header: 'Template',
      render: (note) =>
        note.noteTemplateName ? (
          <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
            {note.noteTemplateName}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
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
      <TreatmentNotesTour />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Practice</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>
            Treatment Notes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>SOAP notes and treatment documentation</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/treatment-notes/templates">
            <Button size="sm" variant="outline">Templates</Button>
          </Link>
          <Button size="sm" variant="primary" onClick={() => router.push('/treatment-notes/new')}>
            + New SOAP Note
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'all'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Notes
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            tab === 'pending'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Review
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-semibold">
              {pendingCount}
            </span>
          )}
        </button>
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
          emptyMessage={
            tab === 'pending'
              ? 'No notes pending review.'
              : 'No treatment notes found. Create your first SOAP note to get started.'
          }
        />
      )}
    </div>
  );
}
