'use client';

import { useState } from 'react';
import { Button } from '@massage/ui';
import { AppointmentWithRelations } from '@massage/types';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AddAppointmentModal } from '@/components/appointments/AddAppointmentModal';
import { EditAppointmentModal } from '@/components/appointments/EditAppointmentModal';
import { AppointmentDetailModal } from '@/components/appointments/AppointmentDetailModal';
import { CancelAppointmentModal } from '@/components/appointments/CancelAppointmentModal';
import { TherapistAvailabilityModal } from '@/components/appointments/TherapistAvailabilityModal';
import { TimeOffModal } from '@/components/appointments/TimeOffModal';
import { useClients } from '@/lib/hooks/use-clients';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useBusinessId } from '@/lib/hooks/use-business-id';

export default function AppointmentsPage() {
  const businessId = useBusinessId();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);

  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | undefined>();

  const { data: clients } = useClients(businessId);
  const { data: therapists } = useTherapists(businessId, { isActive: true });

  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
  };

  const handleSlotClick = (date: Date, therapistId?: string) => {
    setSelectedDate(date);
    setSelectedTherapistId(therapistId);
    setIsAddModalOpen(true);
  };

  const handleEditClick = () => {
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleCancelClick = () => {
    setIsDetailModalOpen(false);
    setIsCancelModalOpen(true);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Utility actions row */}
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsTimeOffModalOpen(true)}
        >
          <ClockIcon className="h-4 w-4 mr-1.5" />
          <span className="hidden xs:inline">Time Off</span>
          <span className="xs:hidden">Off</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAvailabilityModalOpen(true)}
        >
          <UserGroupIcon className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Availability</span>
          <span className="sm:hidden">Avail.</span>
        </Button>
      </div>

      <AppointmentCalendar
        businessId={businessId}
        therapists={therapists || []}
        onAppointmentClick={handleAppointmentClick}
        onSlotClick={handleSlotClick}
      />

      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedDate(null);
          setSelectedTherapistId(undefined);
        }}
        businessId={businessId}
        clients={clients || []}
        therapists={therapists || []}
        initialDate={selectedDate || undefined}
        initialTherapistId={selectedTherapistId}
      />

      <EditAppointmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAppointment(null);
        }}
        businessId={businessId}
        appointment={selectedAppointment}
        clients={clients || []}
        therapists={therapists || []}
      />

      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        businessId={businessId}
        onEdit={handleEditClick}
        onCancel={handleCancelClick}
      />

      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointmentId={selectedAppointment?.id || ''}
        businessId={businessId}
      />

      <TherapistAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        businessId={businessId}
        therapist={null}
        therapists={therapists || []}
      />

      <TimeOffModal
        isOpen={isTimeOffModalOpen}
        onClose={() => setIsTimeOffModalOpen(false)}
        businessId={businessId}
        therapists={therapists || []}
      />
    </div>
  );
}
