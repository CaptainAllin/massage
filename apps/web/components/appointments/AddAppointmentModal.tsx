'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';
import { Client, Therapist } from '@massage/types';
import { useCreateAppointment, useCheckAvailability } from '@/lib/hooks/use-appointments';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { format } from 'date-fns';
import { Users, User, Plus, X } from 'lucide-react';

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
  const [sendReminder, setSendReminder] = useState(true);

  // Group session state
  const [isGroup, setIsGroup] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [groupClientIds, setGroupClientIds] = useState<string[]>([]);
  const [addClientSearch, setAddClientSearch] = useState('');

  const createAppointment = useCreateAppointment(businessId);
  const { checkedItems, toggleItem } = useOnboardingContext();

  const startTime = date && time ? new Date(`${date}T${time}`) : null;
  const endTime =
    startTime && duration
      ? new Date(startTime.getTime() + parseInt(duration) * 60000)
      : null;

  const { data: availabilityCheck } = useCheckAvailability(
    therapistId,
    startTime,
    endTime
  );

  const hasConflict = availabilityCheck && !availabilityCheck.available;

  const filteredClients = addClientSearch
    ? clients.filter((c) => {
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        return name.includes(addClientSearch.toLowerCase()) && !groupClientIds.includes(c.id);
      })
    : [];

  const handleAddGroupClient = (id: string) => {
    if (!groupClientIds.includes(id)) {
      setGroupClientIds((prev) => [...prev, id]);
    }
    setAddClientSearch('');
  };

  const handleRemoveGroupClient = (id: string) => {
    setGroupClientIds((prev) => prev.filter((cId) => cId !== id));
  };

  const getClientName = (id: string) => {
    const c = clients.find((cl) => cl.id === id);
    return c ? `${c.firstName} ${c.lastName}` : id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessId || !therapistId || !date || !time || !duration) {
      alert('Please fill in all required fields');
      return;
    }

    if (!isGroup && !clientId) {
      alert('Please select a client');
      return;
    }

    if (isGroup && groupClientIds.length === 0) {
      alert('Please add at least one client to the group session');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        businessId: businessId!,
        clientId: isGroup ? groupClientIds[0] : clientId,
        therapistId,
        startTime: `${date}T${time}`,
        duration: parseInt(duration),
        serviceType: serviceType || undefined,
        price: price ? parseFloat(price) : undefined,
        notes: notes || undefined,
        isVirtual: isGroup ? false : isVirtual,
        sendReminder,
        isGroup,
        capacity: isGroup && capacity ? parseInt(capacity) : undefined,
        groupClientIds: isGroup ? groupClientIds : undefined,
      } as any);

      if (!checkedItems.has('book_appointment')) toggleItem('book_appointment');

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
    setSendReminder(true);
    setIsGroup(false);
    setCapacity('');
    setGroupClientIds([]);
    setAddClientSearch('');
  };

  useEffect(() => {
    if (!isOpen) resetForm();
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

        {/* Session Type Toggle */}
        <div
          className="rounded-xl p-3"
          style={{ background: '#FAFAFA', border: '1px solid #EFE9F2' }}
        >
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-center gap-2">
              {isGroup ? (
                <Users size={16} style={{ color: '#5D4AA8' }} />
              ) : (
                <User size={16} style={{ color: '#7A7090' }} />
              )}
              <div>
                <p className="text-sm font-medium" style={{ color: '#1E1830' }}>
                  {isGroup ? 'Group session' : 'Individual appointment'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
                  {isGroup ? 'Multiple clients in one session' : 'One client per session'}
                </p>
              </div>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isGroup ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
              onClick={() => {
                setIsGroup((v) => !v);
                setGroupClientIds([]);
                setClientId('');
              }}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isGroup ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
          </label>
        </div>

        {/* Individual Client Select */}
        {!isGroup && (
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
        )}

        {/* Group Clients */}
        {isGroup && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Attendees <span className="text-red-500">*</span>
              </label>
              {capacity && (
                <span className="text-xs" style={{ color: '#7A7090' }}>
                  {groupClientIds.length}/{capacity} spots filled
                </span>
              )}
            </div>

            {/* Selected clients */}
            {groupClientIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {groupClientIds.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
                    style={{ background: '#EFE9F2', color: '#5D4AA8' }}
                  >
                    <span>{getClientName(id)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGroupClient(id)}
                      className="hover:opacity-70"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Client search / add */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search and add clients..."
                value={addClientSearch}
                onChange={(e) => setAddClientSearch(e.target.value)}
              />
              {filteredClients.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-lg overflow-auto max-h-48"
                  style={{ background: '#fff', border: '1px solid #EFE9F2' }}
                >
                  {filteredClients.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => handleAddGroupClient(c.id)}
                    >
                      <span className="flex items-center gap-2">
                        <Plus size={14} style={{ color: '#5D4AA8' }} />
                        {c.firstName} {c.lastName}
                        {c.email && (
                          <span style={{ color: '#7A7090' }} className="text-xs">
                            {c.email}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max capacity (optional)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                placeholder="e.g. 10"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>
        )}

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
              placeholder="e.g., Yoga Class"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price {isGroup ? '(per attendee)' : ''}
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

        {/* Toggles: reminder + virtual (only for individual) */}
        <div
          className="rounded-xl p-3 space-y-3"
          style={{ background: '#FAFAFA', border: '1px solid #EFE9F2' }}
        >
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium" style={{ color: '#1E1830' }}>Send reminder on booking</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Notify the client as soon as this appointment is created</p>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${sendReminder ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
              onClick={() => setSendReminder(v => !v)}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sendReminder ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
          </label>

          {!isGroup && (
            <>
              <div className="border-t" style={{ borderColor: '#EFE9F2' }} />
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1E1830' }}>Virtual appointment</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Create a secure video consultation link</p>
                </div>
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isVirtual ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
                  onClick={() => setIsVirtual(v => !v)}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isVirtual ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </div>
              </label>
            </>
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
            disabled={createAppointment.isPending || !!hasConflict}
          >
            {createAppointment.isPending ? 'Scheduling...' : isGroup ? 'Create Group Session' : 'Schedule Appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
