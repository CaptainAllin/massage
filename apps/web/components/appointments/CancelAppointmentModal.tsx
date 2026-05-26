'use client';

import { useState } from 'react';
import { Modal, Button, Textarea, Radio } from '@massage/ui';
import { CancellationType } from '@massage/types';
import { useCancelAppointment } from '@/lib/hooks/use-appointments';

type RecurringScope = 'this_only' | 'this_and_following' | 'all';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  businessId: string | undefined;
  recurringSeriesId?: string | null;
}

export function CancelAppointmentModal({
  isOpen,
  onClose,
  appointmentId,
  businessId,
  recurringSeriesId,
}: CancelAppointmentModalProps) {
  const [cancellationType, setCancellationType] = useState<CancellationType>(
    CancellationType.CLIENT
  );
  const [reason, setReason] = useState('');
  const [recurringScope, setRecurringScope] = useState<RecurringScope>('this_only');

  const cancelMutation = useCancelAppointment(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await cancelMutation.mutateAsync({
        appointmentId,
        cancellationData: {
          cancellationType,
          reason: reason || undefined,
          ...(recurringSeriesId ? { recurringScope } : {}),
        } as any,
      });

      onClose();
      setReason('');
      setCancellationType(CancellationType.CLIENT);
      setRecurringScope('this_only');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel appointment');
    }
  };

  const cancellationOptions = [
    { value: CancellationType.CLIENT, label: 'Client cancelled' },
    { value: CancellationType.THERAPIST, label: 'Therapist cancelled' },
    { value: CancellationType.BUSINESS, label: 'Business/Admin cancelled' },
  ];

  const recurringOptions = [
    { value: 'this_only', label: 'This appointment only' },
    { value: 'this_and_following', label: 'This and all following appointments' },
    { value: 'all', label: 'All appointments in this series' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Appointment"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </p>
        </div>

        {/* Recurring Scope (only shown for recurring appointments) */}
        {recurringSeriesId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancel scope <span className="text-red-500">*</span>
            </label>
            <Radio
              name="recurringScope"
              options={recurringOptions}
              value={recurringScope}
              onChange={(val) => setRecurringScope(val as RecurringScope)}
            />
          </div>
        )}

        {/* Cancellation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Who is cancelling? <span className="text-red-500">*</span>
          </label>
          <Radio
            name="cancellationType"
            options={cancellationOptions}
            value={cancellationType}
            onChange={(val) => setCancellationType(val as CancellationType)}
          />
        </div>

        {/* Cancellation Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason (optional)
          </label>
          <Textarea
            placeholder="Enter the reason for cancellation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be recorded in the appointment history
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={cancelMutation.isPending}
          >
            Go Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={cancelMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
