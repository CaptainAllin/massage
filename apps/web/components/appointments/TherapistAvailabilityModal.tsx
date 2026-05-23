'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Checkbox } from '@massage/ui';
import { Therapist } from '@massage/types';
import {
  useTherapistAvailability,
  useCreateAvailability,
  useDeleteAvailability,
} from '@/lib/hooks/use-therapist-availability';

interface TherapistAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string | undefined;
  therapist: Therapist | null;
  therapists?: (Therapist & { user?: { firstName?: string; lastName?: string } })[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface DaySchedule {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  availabilityId?: string;
}

export function TherapistAvailabilityModal({
  isOpen,
  onClose,
  businessId,
  therapist,
  therapists,
}: TherapistAvailabilityModalProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [internalTherapistId, setInternalTherapistId] = useState<string>('');

  const internalTherapist =
    therapists?.find((t) => t.id === internalTherapistId) ?? null;
  const effectiveTherapist = therapist ?? internalTherapist;

  const { data: existingAvailability } = useTherapistAvailability(businessId, {
    therapistId: effectiveTherapist?.id,
  });

  const createAvailability = useCreateAvailability(businessId);
  const deleteAvailability = useDeleteAvailability(businessId);

  useEffect(() => {
    if (effectiveTherapist && isOpen) {
      const initialSchedule: DaySchedule[] = DAYS_OF_WEEK.map((day) => {
        const existing = existingAvailability?.find(
          (avail) => avail.dayOfWeek === day.value && avail.isActive
        );

        return {
          dayOfWeek: day.value,
          isActive: !!existing,
          startTime: existing?.startTime || '09:00',
          endTime: existing?.endTime || '17:00',
          availabilityId: existing?.id,
        };
      });

      setSchedule(initialSchedule);
    }
  }, [effectiveTherapist, existingAvailability, isOpen]);

  const handleDayToggle = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, isActive: !day.isActive } : day
      )
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveTherapist) return;

    try {
      for (const day of schedule) {
        if (day.isActive) {
          await createAvailability.mutateAsync({
            businessId: businessId!,
            therapistId: effectiveTherapist.id,
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
          });
        } else if (day.availabilityId) {
          // Delete if it exists but is now inactive
          await deleteAvailability.mutateAsync(day.availabilityId);
        }
      }

      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to update availability');
    }
  };

  const therapistName = effectiveTherapist
    ? (effectiveTherapist as any).user
      ? `${(effectiveTherapist as any).user.firstName || ''} ${(effectiveTherapist as any).user.lastName || ''}`.trim() || 'Therapist'
      : 'Therapist'
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={effectiveTherapist ? `${therapistName}'s Availability` : 'Therapist Availability'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!therapist && therapists && therapists.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Therapist *
            </label>
            <select
              value={internalTherapistId}
              onChange={(e) => setInternalTherapistId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a therapist</option>
              {therapists.map((t) => {
                const name = t.user
                  ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || t.id
                  : t.id;
                return <option key={t.id} value={t.id}>{name}</option>;
              })}
            </select>
          </div>
        )}

        {effectiveTherapist && (
          <p className="text-sm text-gray-600">
            Set the weekly working hours for this therapist. Uncheck days when they're not available.
          </p>
        )}

        {effectiveTherapist && (
          <>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedule = schedule.find((s) => s.dayOfWeek === day.value);

                return (
                  <div
                    key={day.value}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-32">
                      <Checkbox
                        checked={daySchedule?.isActive || false}
                        onChange={() => handleDayToggle(day.value)}
                        label={day.label}
                      />
                    </div>

                    {daySchedule?.isActive && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={daySchedule.startTime}
                          onChange={(e) =>
                            handleTimeChange(day.value, 'startTime', e.target.value)
                          }
                          required
                        />
                        <span className="text-gray-600">to</span>
                        <Input
                          type="time"
                          value={daySchedule.endTime}
                          onChange={(e) =>
                            handleTimeChange(day.value, 'endTime', e.target.value)
                          }
                          required
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createAvailability.isPending || deleteAvailability.isPending}
              >
                {createAvailability.isPending || deleteAvailability.isPending
                  ? 'Saving...'
                  : 'Save Availability'}
              </Button>
            </div>
          </>
        )}

        {!effectiveTherapist && (
          <div className="flex justify-end pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
