'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';
import { Client, Therapist } from '@massage/types';
import { useCreateAppointment, useCheckAvailability } from '@/lib/hooks/use-appointments';
import { format } from 'date-fns';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
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

    if (!clientId || !therapistId || !date || !time || !duration) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        businessId,
        clientId,
        therapistId,
        startTime: `${date}T${time}`,
        duration: parseInt(duration),
        serviceType: serviceType || undefined,
        price: price ? parseFloat(price) : undefined,
        notes: notes || undefined,
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
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

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
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </Select>
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
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
            <option value="120">120 minutes</option>
          </Select>
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
