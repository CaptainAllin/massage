'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@massage/ui';
import { useCreateTreatmentNote } from '@/lib/hooks';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { SOAPNoteEditor, SOAPNoteData } from '@/components/treatment-notes/SOAPNoteEditor';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useAuth } from '@massage/auth';

export default function NewTreatmentNotePage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const { user } = useAuth();
  const createNote = useCreateTreatmentNote(businessId);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);

  const { data: appointmentsData } = useAppointments(businessId, {
    startDate: startOfWeek,
    endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    limit: 100,
  });

  const appointments = (appointmentsData?.data ?? []) as any[];

  const selectedAppointment = appointments.find((a) => a.id === selectedAppointmentId);

  const appointmentOptions = [
    { value: '', label: 'Select an appointment' },
    ...appointments.map((a) => {
      const clientName = a.client
        ? `${a.client.firstName} ${a.client.lastName}`
        : a.clientId;
      const time = new Date(a.startTime).toLocaleString('en-AU', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return { value: a.id, label: `${clientName} — ${time}` };
    }),
  ];

  const handleSave = async (data: SOAPNoteData) => {
    if (!selectedAppointmentId || !selectedAppointment) return;
    await createNote.mutateAsync({
      appointmentId: selectedAppointment.id,
      clientId: selectedAppointment.clientId,
      therapistId: selectedAppointment.therapistId,
      ...data,
      sessionDuration: data.sessionDuration ?? undefined,
    });
    router.push('/treatment-notes');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Practice</p>
        <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>
          New SOAP Note
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
          Document the treatment session with SOAP format
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Appointment *
        </label>
        <Select
          value={selectedAppointmentId}
          options={appointmentOptions}
          onChange={(e) => setSelectedAppointmentId(e.target.value)}
        />
        {appointments.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            No appointments found in the last 7 days. Create an appointment first.
          </p>
        )}
      </div>

      <SOAPNoteEditor
        onSave={handleSave}
        onCancel={() => router.back()}
        isLoading={createNote.isPending}
        userId={user?.id}
        therapistId={selectedAppointment?.therapistId}
        clientId={selectedAppointment?.clientId}
        appointmentId={selectedAppointment?.id}
      />
    </div>
  );
}
