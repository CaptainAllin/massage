'use client';

import { useRouter } from 'next/navigation';
import { Select } from '@massage/ui';
import { useCreateTreatmentNote } from '@/lib/hooks';
import { SOAPNoteEditor, SOAPNoteData } from '@/components/treatment-notes/SOAPNoteEditor';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function NewTreatmentNotePage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const createNote = useCreateTreatmentNote(businessId);

  const handleSave = async (data: SOAPNoteData) => {
    await createNote.mutateAsync({
      appointmentId: 'temp-appointment-id', // TODO: Select from list
      clientId: 'temp-client-id', // TODO: Get from appointment
      therapistId: 'temp-therapist-id', // TODO: Get from current user
      ...data,
      sessionDuration: data.sessionDuration ?? undefined,
    });
    router.push('/treatment-notes');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-display">
          New SOAP Note
        </h1>
        <p className="text-muted-foreground mt-2">
          Document treatment session with SOAP format
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Appointment *
        </label>
        <Select
          options={[
            { value: '', label: 'Select an appointment' },
            { value: 'appt1', label: 'John Doe - Today 2:00 PM' },
            { value: 'appt2', label: 'Jane Smith - Today 3:30 PM' },
          ]}
          placeholder="Select appointment"
        />
      </div>

      <SOAPNoteEditor
        onSave={handleSave}
        onCancel={() => router.back()}
        isLoading={createNote.isPending}
      />
    </div>
  );
}
