'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';
import { Client, Therapist } from '@massage/types';
import { useCreateAppointment, useCheckAvailability } from '@/lib/hooks/use-appointments';
import { format } from 'date-fns';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string | undefined;
  clients: Client[];
  therapists: Therapist[];
  initialDate?: Date;
  initialTherapistId?: string;
}

export function AddAppointmentModal({
  isOpen,
  onClose,
  businessId,
  clients,
  therapists,
  initialDate,
  initialTherapistId,
}: AddAppointmentModalProps) {
  const [clientId, setClientId] = useState('');
  const [therapistId, setTherapistId] = useState(initialTherapistId || '');
  const [date, setDate] = useState(
    initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [time, setTime] = useState(
    initialDate ? format(initialDate, 'HH:mm') : '09:00'
  );
  const [duration, setDuration] = useState('60');
  const [serviceType, setServiceType] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);

  const createAppointment = useCreateAppointment(businessId);

  // Calculate start and end times for availability check
  const startTime = date && time ? new Date(`${date}T${time}`) : null;
  const endTime =
    startTime && duration
      ? new Date(startTime.getTime() + parseInt(duration) * 60000)
      : null;

  // Check availability (debounced)
  const { data: availabilityCheck } = useCheckAvailability(
    therapistId,
    startTime,
    endTime
  );

  const hasConflict = availabilityCheck && !availabilityCheck.available;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessId || !clientId || !therapistId || !date || !time || !duration) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        businessId: businessId!,
        clientId,
        therapistId,
        startTime: `${date}T${time}`,
        duration: parseInt(duration),
        serviceType: serviceType || undefined,
        price: price ? parseFloat(price) : undefined,
        notes: notes || undefined,
        isVirtual,
      });

      onClose();
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Failed to create appointment');
    }
  };

  const resetForm = () => {
    setClientId('');
    setTherapistId(initialTherapistId || '');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime('09:00');
    setDuration('60');
    setServiceType('');
    setPrice('');
    setNotes('');
    setIsVirtual(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const clientOptions = [
    { value: '', label: 'Select a client' },
    ...clients.map((client) => ({
      value: client.id,
      label: `${client.firstName} ${client.lastName}`,
    })),
  ];

  const therapistOptions = [
    { value: '', label: 'Select a therapist' },
    ...therapists.map((therapist: any) => ({
      value: therapist.id,
      label: therapist.user
        ? `${therapist.user.firstName || ''} ${therapist.user.lastName || ''}`
        : 'Unknown',
    })),
  ];

  const durationOptions = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '60 minutes' },
    { value: '90', label: '90 minutes' },
    { value: '120', label: '120 minutes' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Appointment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client <span className="text-red-500">*</span>
          </label>
          <Select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            options={clientOptions}
          />
        </div>

        {/* Therapist Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Therapist <span className="text-red-500">*</span>
          </label>
          <Select
            value={therapistId}
            onChange={(e) => setTherapistId(e.target.value)}
            required
            options={therapistOptions}
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration <span className="text-red-500">*</span>
          </label>
          <Select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            options={durationOptions}
          />
        </div>

        {/* Conflict Warning */}
        {hasConflict && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ {availabilityCheck?.message || 'This time slot is not available'}
            </p>
            {availabilityCheck?.conflicts && availabilityCheck.conflicts.length > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Conflicting with {availabilityCheck.conflicts.length} appointment(s)
              </p>
            )}
          </div>
        )}

        {/* Service Type and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type
            </label>
            <Input
              type="text"
              placeholder="e.g., Deep Tissue Massage"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <Textarea
            placeholder="Additional notes or instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Virtual Appointment Toggle */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isVirtual}
              onChange={(e) => setIsVirtual(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Virtual Appointment (Video Call)</span>
          </label>

          {isVirtual && (
            <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              A secure video consultation link will be created for this appointment.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createAppointment.isPending || hasConflict}
          >
            {createAppointment.isPending ? 'Scheduling...' : 'Schedule Appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
