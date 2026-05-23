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
import { CalendarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function AppointmentsPage() {
  const businessId = useBusinessId();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);

  // Selected data
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | undefined>();

  // Fetch clients and therapists
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

  const handleCancelModalClose = () => {
    setIsCancelModalOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">
            Appointments
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your appointment schedule and availability
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsTimeOffModalOpen(true)}
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Time Off
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsAvailabilityModalOpen(true)}
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Availability
          </Button>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <CalendarIcon className="h-5 w-5 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <AppointmentCalendar
        businessId={businessId}
        therapists={therapists || []}
        onAppointmentClick={handleAppointmentClick}
        onSlotClick={handleSlotClick}
      />

      {/* Modals */}
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
        onClose={handleCancelModalClose}
        appointmentId={selectedAppointment?.id || ''}
        businessId={businessId}
      />

      <TherapistAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        businessId={businessId}
        therapist={null} // TODO: Select therapist from dropdown
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
