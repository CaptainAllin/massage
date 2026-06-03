'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@massage/ui';
import { AppointmentWithRelations } from '@massage/types';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentsTour } from '@/components/appointments/AppointmentsTour';
import { AddAppointmentModal } from '@/components/appointments/AddAppointmentModal';
import { EditAppointmentModal } from '@/components/appointments/EditAppointmentModal';
import { AppointmentDetailModal } from '@/components/appointments/AppointmentDetailModal';
import { CancelAppointmentModal } from '@/components/appointments/CancelAppointmentModal';
import { TherapistAvailabilityModal } from '@/components/appointments/TherapistAvailabilityModal';
import { TimeOffModal } from '@/components/appointments/TimeOffModal';
import { WaitlistPanel } from '@/components/appointments/WaitlistPanel';
import { useClients } from '@/lib/hooks/use-clients';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useWaitlist } from '@/lib/hooks/use-waitlist';
import { ClockIcon, UserGroupIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';

type Tab = 'calendar' | 'waitlist';

export default function AppointmentsPage() {
  const businessId = useBusinessId();
  const { checkedItems, toggleItem } = useOnboardingContext();

  const [activeTab, setActiveTab] = useState<Tab>('calendar');
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
  // Prefetch waitlist so it's cached before the user switches tabs
  useWaitlist(businessId);

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

  const bookingHref = businessId ? `/book/${businessId}` : null;

  const handleCopyBookingLink = () => {
    if (!bookingHref) return;
    const url = `${window.location.origin}${bookingHref}`;
    navigator.clipboard.writeText(url).catch(() => {});
    if (!checkedItems.has('share_booking_link')) toggleItem('share_booking_link');
  };

  return (
    <div className="space-y-5">
      {/* Onboarding tour */}
      <AppointmentsTour businessId={businessId} />

      {/* Tab bar + utility actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['calendar', 'waitlist'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'calendar' ? 'Calendar' : 'Waitlist'}
            </button>
          ))}
        </div>

        {activeTab === 'calendar' && (
          <div className="flex gap-2">
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
        )}
      </div>

      {activeTab === 'calendar' && (
        <>
          <AppointmentCalendar
            businessId={businessId}
            therapists={therapists || []}
            onAppointmentClick={handleAppointmentClick}
            onSlotClick={handleSlotClick}
          />

          {/* Booking page link card */}
          {bookingHref && (
            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#EDE5F4' }}
              >
                <LinkIcon className="h-5 w-5" style={{ color: '#5D4AA8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#1E1830' }}>Client booking page</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#7A7090' }}>
                  Share this link so clients can self-book without a login
                </p>
                <p className="text-xs mt-1 font-medium truncate" style={{ color: '#5D4AA8' }}>
                  {typeof window !== 'undefined' ? window.location.origin : ''}{bookingHref}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleCopyBookingLink}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ border: '1px solid rgba(93,74,168,0.3)', color: '#5D4AA8', background: '#fff' }}
                >
                  Copy link
                </button>
                <Link
                  href={bookingHref}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }}
                >
                  Preview
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'waitlist' && (
        <WaitlistPanel
          businessId={businessId}
          clients={clients || []}
          therapists={therapists || []}
        />
      )}

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
        recurringSeriesId={selectedAppointment?.recurringSeriesId}
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
