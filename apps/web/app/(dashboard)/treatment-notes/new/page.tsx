'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@massage/ui';
import { useCreateTreatmentNote } from '@/lib/hooks';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useServices } from '@/lib/hooks/use-services';
import { useNoteTemplates } from '@/lib/hooks/use-note-templates';
import { SOAPNoteEditor, SOAPNoteData } from '@/components/treatment-notes/SOAPNoteEditor';
import { TemplatePickerModal } from '@/components/treatment-notes/TemplatePickerModal';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useAuth } from '@massage/auth';
import { NoteTemplate } from '@massage/types';

export default function NewTreatmentNotePage() {
  const router = useRouter();
  const businessId = useBusinessId();
  const { user } = useAuth();
  const createNote = useCreateTreatmentNote(businessId);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [showTemplatePicker, setShowTemplatePicker] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);

  const { data: appointmentsData } = useAppointments(businessId, {
    startDate: startOfWeek,
    endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    limit: 100,
  });
  const { data: services = [] } = useServices(businessId);
  const { data: noteTemplates = [] } = useNoteTemplates(businessId);

  const appointments = (appointmentsData?.data ?? []) as any[];
  const selectedAppointment = appointments.find((a) => a.id === selectedAppointmentId);

  // Auto-select template when appointment changes if service has a default note template
  useEffect(() => {
    if (!selectedAppointmentId || !selectedAppointment?.serviceId) return;
    const service = (services as any[]).find((s: any) => s.id === selectedAppointment.serviceId);
    if (!service?.defaultNoteTemplateId) return;
    const template = (noteTemplates as any[]).find((t: any) => t.id === service.defaultNoteTemplateId);
    if (template && !selectedTemplate) {
      setSelectedTemplate(template as NoteTemplate);
      setShowTemplatePicker(false);
    }
  }, [selectedAppointmentId, selectedAppointment, services, noteTemplates]);

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

  const handleTemplateSelect = (template: NoteTemplate | null) => {
    setSelectedTemplate(template);
    setShowTemplatePicker(false);
  };

  const handleChangeTemplate = () => {
    setShowTemplatePicker(true);
  };

  const handleSave = async (data: SOAPNoteData) => {
    if (!selectedAppointmentId || !selectedAppointment) return;
    await createNote.mutateAsync({
      appointmentId: selectedAppointment.id,
      clientId: selectedAppointment.clientId,
      therapistId: selectedAppointment.therapistId,
      noteTemplateId: selectedTemplate?.id ?? null,
      noteTemplateName: selectedTemplate?.name ?? null,
      ...data,
      sessionDuration: data.sessionDuration ?? undefined,
    });
    router.push('/treatment-notes');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showTemplatePicker && (
        <TemplatePickerModal
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Practice</p>
        <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>
          New Treatment Note
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
        template={selectedTemplate}
        onChangeTemplate={handleChangeTemplate}
      />
    </div>
  );
}
