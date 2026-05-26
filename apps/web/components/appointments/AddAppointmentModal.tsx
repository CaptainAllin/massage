'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';
import { Client, Therapist } from '@massage/types';
import { useCreateAppointment, useCheckAvailability } from '@/lib/hooks/use-appointments';
import { useOnboardingContext } from '@/components/onboarding/OnboardingProvider';
import { useRooms } from '@/lib/hooks/use-rooms';
import { format } from 'date-fns';
import { Users, User, Plus, X, RefreshCw, Calendar } from 'lucide-react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [roomId, setRoomId] = useState('');

  // Group session state
  const [isGroup, setIsGroup] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [groupClientIds, setGroupClientIds] = useState<string[]>([]);
  const [addClientSearch, setAddClientSearch] = useState('');

  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'DAILY'>('WEEKLY');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [endCondition, setEndCondition] = useState<'occurrences' | 'date'>('occurrences');
  const [occurrences, setOccurrences] = useState('8');
  const [endDate, setEndDate] = useState('');
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const createAppointment = useCreateAppointment(businessId);
  const { checkedItems, toggleItem } = useOnboardingContext();
  const { data: rooms = [] } = useRooms(businessId, true);

  const startTime = date && time ? new Date(`${date}T${time}`) : null;
  const endTime =
    startTime && duration
      ? new Date(startTime.getTime() + parseInt(duration) * 60000)
      : null;

  const { data: availabilityCheck } = useCheckAvailability(
    !isRecurring ? therapistId : '',
    startTime,
    endTime
  );

  const hasConflict = !isRecurring && availabilityCheck && !availabilityCheck.available;

  const filteredClients = addClientSearch
    ? clients.filter((c) => {
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        return name.includes(addClientSearch.toLowerCase()) && !groupClientIds.includes(c.id);
      })
    : [];

  const handleAddGroupClient = (id: string) => {
    if (!groupClientIds.includes(id)) setGroupClientIds((prev) => [...prev, id]);
    setAddClientSearch('');
  };

  const handleRemoveGroupClient = (id: string) => {
    setGroupClientIds((prev) => prev.filter((cId) => cId !== id));
  };

  const getClientName = (id: string) => {
    const c = clients.find((cl) => cl.id === id);
    return c ? `${c.firstName} ${c.lastName}` : id;
  };

  const toggleDay = (dow: number) => {
    setSelectedDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
    );
  };

  // Auto-select the day of week from the chosen date when frequency changes to weekly/fortnightly
  useEffect(() => {
    if ((frequency === 'WEEKLY' || frequency === 'FORTNIGHTLY') && date) {
      const dow = new Date(date + 'T12:00:00').getDay();
      setSelectedDays([dow]);
    }
  }, [frequency]);

  // Preview recurring dates
  useEffect(() => {
    if (!isRecurring || !date || !time) return;
    if (endCondition === 'date' && !endDate) return;
    if (endCondition === 'occurrences' && (!occurrences || parseInt(occurrences) < 1)) return;

    const timeout = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const body: any = {
          frequency,
          interval: 1,
          startDate: date,
          startTime: time,
          ...(endCondition === 'occurrences' ? { occurrences: parseInt(occurrences) } : { endDate }),
        };
        if (frequency === 'WEEKLY' || frequency === 'FORTNIGHTLY') {
          if (selectedDays.length > 0) body.daysOfWeek = selectedDays;
        }
        const r = await fetch('/api/recurring-appointments/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (d.success) setPreviewDates(d.data.dates.slice(0, 10));
      } catch {
        // ignore preview errors
      } finally {
        setLoadingPreview(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [isRecurring, frequency, selectedDays, date, time, endCondition, occurrences, endDate]);

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

    if (isRecurring) {
      if ((frequency === 'WEEKLY' || frequency === 'FORTNIGHTLY') && selectedDays.length === 0) {
        alert('Please select at least one day of the week');
        return;
      }
      if (endCondition === 'date' && !endDate) {
        alert('Please select an end date');
        return;
      }
    }

    try {
      if (isRecurring) {
        const body: any = {
          businessId,
          clientId: isGroup ? groupClientIds[0] : clientId,
          therapistId,
          frequency,
          interval: 1,
          startTime: time,
          duration: parseInt(duration),
          startDate: date,
          serviceType: serviceType || undefined,
          price: price ? parseFloat(price) : undefined,
          notes: notes || undefined,
          ...(endCondition === 'occurrences' ? { occurrences: parseInt(occurrences) } : { endDate }),
        };
        if (frequency === 'WEEKLY' || frequency === 'FORTNIGHTLY') {
          if (selectedDays.length > 0) body.daysOfWeek = selectedDays;
        }
        const r = await fetch('/api/recurring-appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (!d.success) throw new Error(d.message || 'Failed to create recurring series');
      } else {
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
          roomId: roomId || undefined,
        } as any);
      }

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
    setIsRecurring(false);
    setFrequency('WEEKLY');
    setSelectedDays([]);
    setEndCondition('occurrences');
    setOccurrences('8');
    setEndDate('');
    setPreviewDates([]);
    setRoomId('');
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

  const frequencyOptions = [
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'FORTNIGHTLY', label: 'Fortnightly (every 2 weeks)' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'DAILY', label: 'Daily' },
  ];

  const isPending = createAppointment.isPending;

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

            {groupClientIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {groupClientIds.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
                    style={{ background: '#EFE9F2', color: '#5D4AA8' }}
                  >
                    <span>{getClientName(id)}</span>
                    <button type="button" onClick={() => handleRemoveGroupClient(id)} className="hover:opacity-70">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                        {c.email && <span style={{ color: '#7A7090' }} className="text-xs">{c.email}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
              {isRecurring ? 'Start Date' : 'Date'} <span className="text-red-500">*</span>
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

        {/* Conflict Warning (single appointments only) */}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
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

        {/* Room */}
        {(rooms as any[]).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room (optional)</label>
            <Select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              options={[
                { value: '', label: 'No room assigned' },
                ...(rooms as any[]).map((r: any) => ({ value: r.id, label: r.name })),
              ]}
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <Textarea
            placeholder="Additional notes or instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Toggles */}
        <div
          className="rounded-xl p-3 space-y-3"
          style={{ background: '#FAFAFA', border: '1px solid #EFE9F2' }}
        >
          {/* Recurring Toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} style={{ color: isRecurring ? '#5D4AA8' : '#7A7090' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#1E1830' }}>Repeat appointment</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Book a recurring series</p>
              </div>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isRecurring ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
              onClick={() => setIsRecurring((v) => !v)}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
          </label>

          {!isRecurring && (
            <>
              <div className="border-t" style={{ borderColor: '#EFE9F2' }} />
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
            </>
          )}
        </div>

        {/* Recurring Options */}
        {isRecurring && (
          <div className="rounded-xl p-4 space-y-4" style={{ background: '#F5F0FF', border: '1px solid #DDD0F0' }}>
            <p className="text-sm font-semibold" style={{ color: '#5D4AA8' }}>Repeat settings</p>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                options={frequencyOptions}
              />
            </div>

            {/* Day-of-week picker for weekly/fortnightly */}
            {(frequency === 'WEEKLY' || frequency === 'FORTNIGHTLY') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day(s) of the week</label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, dow) => (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => toggleDay(dow)}
                      className="w-9 h-9 rounded-full text-xs font-medium transition-colors"
                      style={{
                        background: selectedDays.includes(dow) ? '#5D4AA8' : '#EFE9F2',
                        color: selectedDays.includes(dow) ? '#fff' : '#5D4AA8',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* End Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ends</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="endCondition"
                    value="occurrences"
                    checked={endCondition === 'occurrences'}
                    onChange={() => setEndCondition('occurrences')}
                    className="text-[#5D4AA8]"
                  />
                  <span className="text-sm text-gray-700">After</span>
                  <Input
                    type="number"
                    min="1"
                    max="104"
                    value={occurrences}
                    onChange={(e) => setOccurrences(e.target.value)}
                    disabled={endCondition !== 'occurrences'}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-gray-700">sessions</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="endCondition"
                    value="date"
                    checked={endCondition === 'date'}
                    onChange={() => setEndCondition('date')}
                    className="text-[#5D4AA8]"
                  />
                  <span className="text-sm text-gray-700">On date</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={endCondition !== 'date'}
                    className="flex-1"
                  />
                </label>
              </div>
            </div>

            {/* Date Preview */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} style={{ color: '#5D4AA8' }} />
                <p className="text-sm font-medium" style={{ color: '#5D4AA8' }}>
                  {loadingPreview ? 'Calculating...' : previewDates.length > 0 ? `${previewDates.length}+ sessions` : 'Preview'}
                </p>
              </div>
              {previewDates.length > 0 && (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {previewDates.map((iso, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5D4AA8] flex-shrink-0" />
                      <span className="text-xs text-gray-600">
                        {new Date(iso).toLocaleDateString('en-AU', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}{' '}
                        at {new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  ))}
                  {parseInt(occurrences) > 10 && endCondition === 'occurrences' && (
                    <p className="text-xs text-gray-400 pl-3.5">
                      + {parseInt(occurrences) - 10} more sessions
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending || (!isRecurring && !!hasConflict)}
          >
            {isPending
              ? 'Scheduling...'
              : isRecurring
              ? 'Create Recurring Series'
              : isGroup
              ? 'Create Group Session'
              : 'Schedule Appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
