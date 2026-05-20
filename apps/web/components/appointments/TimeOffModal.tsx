'use client';

import { useState } from 'react';
import { Modal, Button, Input, Textarea, Checkbox, Select } from '@massage/ui';
import { Therapist } from '@massage/types';
import { useCreateTimeOff } from '@/lib/hooks/use-therapist-availability';
import { format } from 'date-fns';

interface TimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  therapists: Therapist[];
  initialTherapistId?: string;
}

export function TimeOffModal({
  isOpen,
  onClose,
  businessId,
  therapists,
  initialTherapistId,
}: TimeOffModalProps) {
  const [therapistId, setTherapistId] = useState(initialTherapistId || '');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);

  const createTimeOff = useCreateTimeOff(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!therapistId || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('End date must be after start date');
      return;
    }

    try {
      await createTimeOff.mutateAsync({
        businessId,
        therapistId,
        startDate,
        endDate,
        reason: reason || undefined,
        isAllDay,
      });

      onClose();
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Failed to create time off');
    }
  };

  const resetForm = () => {
    setTherapistId(initialTherapistId || '');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setReason('');
    setIsAllDay(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Time Off" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Therapist Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Therapist <span className="text-red-500">*</span>
          </label>
          <Select
            value={therapistId}
            onChange={(e) => setTherapistId(e.target.value)}
            required
          >
            <option value="">Select a therapist</option>
            {therapists.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.user
                  ? `${therapist.user.firstName || ''} ${therapist.user.lastName || ''}`
                  : 'Unknown'}
              </option>
            ))}
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* All Day Toggle */}
        <div>
          <Checkbox
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            label="All day"
          />
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Check this if the therapist is unavailable for the entire day
          </p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason (optional)
          </label>
          <Textarea
            placeholder="e.g., Vacation, Sick leave, Conference..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onClose();
              resetForm();
            }}
            disabled={createTimeOff.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createTimeOff.isPending}
          >
            {createTimeOff.isPending ? 'Adding...' : 'Add Time Off'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
