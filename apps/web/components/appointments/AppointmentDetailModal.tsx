'use client';

import { useState } from 'react';
import { Modal, Button, Badge } from '@massage/ui';
import { AppointmentWithRelations, AppointmentStatus } from '@massage/types';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import {
  useConfirmAppointment,
  useStartAppointment,
  useCompleteAppointment,
  useMarkNoShowAppointment,
} from '@/lib/hooks/use-appointments';
import { useCreateInvoice } from '@/lib/hooks/use-invoices';
import { useVideoSession, useCreateVideoSession } from '@/lib/hooks/use-video-sessions';
import { VideoSessionModal } from '../video/VideoSessionModal';
import { FileText, CreditCard, Video } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentWithRelations | null;
  businessId: string | undefined;
  onEdit: () => void;
  onCancel: () => void;
}

export function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  businessId,
  onEdit,
  onCancel,
}: AppointmentDetailModalProps) {
  const router = useRouter();
  const confirmMutation = useConfirmAppointment(businessId);
  const startMutation = useStartAppointment(businessId);
  const completeMutation = useCompleteAppointment(businessId);
  const noShowMutation = useMarkNoShowAppointment(businessId);
  const createInvoiceMutation = useCreateInvoice(businessId);
  const { data: videoSession } = useVideoSession(appointment?.id || '');
  const createVideoSession = useCreateVideoSession();

  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  if (!appointment) return null;

  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  const clientName = appointment.client
    ? `${appointment.client.firstName} ${appointment.client.lastName}`
    : 'Unknown Client';
  const therapistName = appointment.therapist?.user
    ? `${appointment.therapist.user.firstName || ''} ${appointment.therapist.user.lastName || ''}`
    : 'Unknown Therapist';

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(appointment.id);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to confirm appointment');
    }
  };

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(appointment.id);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to start appointment');
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(appointment.id);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to complete appointment');
    }
  };

  const handleNoShow = async () => {
    if (!confirm('Are you sure you want to mark this appointment as no-show?')) {
      return;
    }
    try {
      await noShowMutation.mutateAsync(appointment.id);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to mark as no-show');
    }
  };

  const handleCreateInvoice = async () => {
    if (!appointment.client || !appointment.price) {
      alert('Cannot create invoice: missing client or price information');
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const invoice = await createInvoiceMutation.mutateAsync({
        clientId: appointment.clientId,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [
          {
            description: `${appointment.serviceType || 'Massage'} - ${appointment.duration} minutes`,
            quantity: 1,
            unitPrice: appointment.price ?? 0,
            total: appointment.price ?? 0,
            appointmentId: appointment.id,
          },
        ],
      });

      if (invoice?.id) router.push(`/invoices/${invoice.id}`);
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to create invoice');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const isCompleted = appointment.status === AppointmentStatus.COMPLETED;
  const isCancelled = appointment.status === AppointmentStatus.CANCELLED;
  const isNoShow = appointment.status === AppointmentStatus.NO_SHOW;
  const hasInvoice = !!appointment.invoiceId;
  const hasPayment = !!appointment.paymentId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Details" size="lg">
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <StatusBadge status={appointment.status} />
          {!isCompleted && !isCancelled && !isNoShow && (
            <Button variant="secondary" onClick={onEdit} size="sm">
              Edit
            </Button>
          )}
        </div>

        {/* Client Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Client</h3>
          <p className="text-lg font-semibold text-gray-900">{clientName}</p>
          {appointment.client && (
            <div className="mt-2 space-y-1">
              {appointment.client.email && (
                <p className="text-sm text-gray-600">{appointment.client.email}</p>
              )}
              {appointment.client.phoneNumber && (
                <p className="text-sm text-gray-600">{appointment.client.phoneNumber}</p>
              )}
              <Link
                href={`/clients/${appointment.client.id}`}
                className="text-sm text-sage-600 hover:text-sage-700 font-medium inline-block mt-2"
              >
                View Client Profile →
              </Link>
            </div>
          )}
        </div>

        {/* Therapist Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Therapist</h3>
          <p className="text-lg font-semibold text-gray-900">{therapistName}</p>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Date</h3>
            <p className="text-base text-gray-900">{format(startTime, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Time</h3>
            <p className="text-base text-gray-900">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </p>
          </div>
        </div>

        {/* Duration, Service, Price */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Duration</h3>
            <p className="text-base text-gray-900">{appointment.duration} min</p>
          </div>
          {appointment.serviceType && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Service</h3>
              <p className="text-base text-gray-900">{appointment.serviceType}</p>
            </div>
          )}
          {appointment.price && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Price</h3>
              <p className="text-base text-gray-900">${appointment.price.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {appointment.notes}
            </p>
          </div>
        )}

        {/* Virtual Appointment */}
        {appointment.isVirtual && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Video className="h-4 w-4" />
              Virtual Appointment
            </h3>
            {!videoSession ? (
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  This is a virtual appointment. Create a video session to enable the video call.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => createVideoSession.mutate(appointment.id)}
                  disabled={createVideoSession.isPending}
                >
                  {createVideoSession.isPending ? 'Creating...' : 'Create Video Session'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  Video session is ready. Click the button below to join the call.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowVideoModal(true)}
                  disabled={appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.NO_SHOW}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Video Call
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Payment Status */}
        {isCompleted && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Payment Status
            </h3>
            <div className="flex items-center gap-4">
              {hasPayment && (
                <div className="flex items-center gap-2">
                  <Badge variant="success">Paid</Badge>
                  <Link
                    href={`/payments/${appointment.paymentId}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Payment →
                  </Link>
                </div>
              )}
              {hasInvoice && !hasPayment && (
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Invoiced</Badge>
                  <Link
                    href={`/invoices/${appointment.invoiceId}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Invoice →
                  </Link>
                </div>
              )}
              {!hasInvoice && !hasPayment && (
                <Badge variant="default">Unpaid</Badge>
              )}
            </div>
          </div>
        )}

        {/* Cancellation Info */}
        {appointment.cancellation && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">Cancellation Details</h3>
            <p className="text-sm text-red-700">
              <strong>Cancelled:</strong>{' '}
              {format(new Date(appointment.cancellation.cancelledAt), 'MMM d, yyyy h:mm a')}
            </p>
            <p className="text-sm text-red-700">
              <strong>Type:</strong> {appointment.cancellation.cancellationType}
            </p>
            {appointment.cancellation.reason && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Reason:</strong> {appointment.cancellation.reason}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          {appointment.status === AppointmentStatus.SCHEDULED && (
            <>
              <Button variant="secondary" onClick={handleNoShow}>
                Mark No-Show
              </Button>
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                Confirm
              </Button>
            </>
          )}

          {appointment.status === AppointmentStatus.CONFIRMED && (
            <>
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleStart}>
                Start Session
              </Button>
            </>
          )}

          {appointment.status === AppointmentStatus.IN_PROGRESS && (
            <Button variant="primary" onClick={handleComplete}>
              Complete
            </Button>
          )}

          {isCompleted && (
            <>
              <Link href={`/treatment-notes?appointmentId=${appointment.id}`}>
                <Button variant="secondary">Add Treatment Note</Button>
              </Link>
              {!hasInvoice && (
                <Button
                  variant="secondary"
                  onClick={handleCreateInvoice}
                  disabled={isCreatingInvoice}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isCreatingInvoice ? 'Creating...' : 'Create Invoice'}
                </Button>
              )}
              {!hasPayment && (
                <Button variant="primary">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video Session Modal */}
      {showVideoModal && videoSession && (
        <VideoSessionModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          sessionId={videoSession.id}
        />
      )}
    </Modal>
  );
}
