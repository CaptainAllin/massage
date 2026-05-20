'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';
import { Client, Therapist, AppointmentWithRelations } from '@massage/types';
import { useUpdateAppointment, useCheckAvailability } from '@/lib/hooks/use-appointments';
import { format } from 'date-fns';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  appointment: AppointmentWithRelations | null;
  clients: Client[];
  therapists: Therapist[];
}

export function EditAppointmentModal({
  isOpen,
  onClose,
  businessId,
  appointment,
  clients,
  therapists,
}: EditAppointmentModalProps) {
  const [clientId, setClientId] = useState('');
  const [therapistId, setTherapistId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [serviceType, setServiceType] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const updateAppointment = useUpdateAppointment(
    appointment?.id || '',
    businessId
  );

  // Populate form when appointment changes
  useEffect(() => {
    if (appointment) {
      setClientId(appointment.clientId);
      setTherapistId(appointment.therapistId);
      const startTime = new Date(appointment.startTime);
      setDate(format(startTime, 'yyyy-MM-dd'));
      setTime(format(startTime, 'HH:mm'));
      setDuration(String(appointment.duration));
      setServiceType(appointment.serviceType || '');
      setPrice(appointment.price ? String(appointment.price) : '');
      setNotes(appointment.notes || '');
    }
  }, [appointment]);

  // Calculate start and end times for availability check
  const startTime = date && time ? new Date(`${date}T${time}`) : null;
  const endTime =
    startTime && duration
      ? new Date(startTime.getTime() + parseInt(duration) * 60000)
      : null;

  // Check availability (excluding current appointment)
  const { data: availabilityCheck } = useCheckAvailability(
    therapistId,
    startTime,
    endTime,
    appointment?.id
  );

  const hasConflict = availabilityCheck && !availabilityCheck.available;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || !therapistId || !date || !time || !duration || !appointment) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await updateAppointment.mutateAsync({
        clientId,
        therapistId,
        startTime: `${date}T${time}`,
        duration: parseInt(duration),
        serviceType: serviceType || undefined,
        price: price ? parseFloat(price) : undefined,
        notes: notes || undefined,
      });

      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to update appointment');
    }
  };

  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Appointment" size="lg">
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
            disabled={updateAppointment.isPending || hasConflict}
          >
            {updateAppointment.isPending ? 'Updating...' : 'Update Appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
