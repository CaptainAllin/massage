'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';
import { Client } from '@massage/types';
import { useClients } from '@/lib/hooks/use-clients';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useCreateAppointment, useCheckAvailability } from '@/lib/hooks/use-appointments';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useServices } from '@/lib/hooks/use-services';
import { useNewSession } from './NewSessionContext';
import { format } from 'date-fns';

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export function NewSessionModal() {
  const { isOpen, closeNewSession } = useNewSession();
  const businessId = useBusinessId();

  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [therapistId, setTherapistId] = useState('');
  const [therapistSearch, setTherapistSearch] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);
  const [showTherapistDropdown, setShowTherapistDropdown] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [serviceType, setServiceType] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [sendReminder, setSendReminder] = useState(true);
  const [isVirtual, setIsVirtual] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const therapistSearchRef = useRef<HTMLInputElement>(null);
  const therapistDropdownRef = useRef<HTMLDivElement>(null);

  const { data: clients = [] } = useClients(businessId, { search, limit: 8 } as any);
  const { data: therapists = [] } = useTherapists(businessId);
  const { data: services = [] } = useServices(businessId);
  const createAppointment = useCreateAppointment(businessId);

  const startTime = date && time ? new Date(`${date}T${time}`) : null;
  const endTime = startTime && duration
    ? new Date(startTime.getTime() + parseInt(duration) * 60000)
    : null;
  const { data: availabilityCheck } = useCheckAvailability(therapistId, startTime, endTime);
  const hasConflict = !!availabilityCheck && !availabilityCheck.available;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    } else {
      reset();
    }
  }, [isOpen]);

  useEffect(() => {
    setShowDropdown(search.length >= 2 && !selectedClient);
  }, [search, selectedClient]);

  const filteredTherapists = (therapists as any[]).filter((t: any) => {
    if (!therapistSearch) return true;
    const name = t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim().toLowerCase() : '';
    return name.includes(therapistSearch.toLowerCase());
  });

  function handleSelectTherapist(therapist: any) {
    const name = therapist.user
      ? `${therapist.user.firstName || ''} ${therapist.user.lastName || ''}`.trim()
      : 'Unknown';
    setSelectedTherapist(therapist);
    setTherapistId(therapist.id);
    setTherapistSearch(name);
    setShowTherapistDropdown(false);
  }

  function handleClearTherapist() {
    setSelectedTherapist(null);
    setTherapistId('');
    setTherapistSearch('');
    setTimeout(() => therapistSearchRef.current?.focus(), 50);
  }

  function reset() {
    setSearch('');
    setSelectedClient(null);
    setTherapistId('');
    setTherapistSearch('');
    setSelectedTherapist(null);
    setShowTherapistDropdown(false);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime('09:00');
    setDuration('60');
    setServiceType('');
    setServiceId('');
    setPrice('');
    setNotes('');
    setSendReminder(true);
    setIsVirtual(false);
    setShowDropdown(false);
  }

  function handleSelectClient(client: Client) {
    setSelectedClient(client);
    setSearch(`${client.firstName} ${client.lastName}`);
    setShowDropdown(false);
  }

  function handleClearClient() {
    setSelectedClient(null);
    setSearch('');
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !selectedClient || !therapistId || !date || !time) return;

    try {
      await createAppointment.mutateAsync({
        businessId,
        clientId: selectedClient.id,
        therapistId,
        startTime: `${date}T${time}`,
        duration: parseInt(duration),
        serviceType: serviceType || undefined,
        serviceId: serviceId || undefined,
        price: price ? parseFloat(price) : undefined,
        notes: notes || undefined,
        isVirtual,
        sendReminder,
      } as any);
      closeNewSession();
    } catch (err: any) {
      alert(err.message || 'Failed to create session');
    }
  }

  const canSubmit = !!selectedClient && !!therapistId && !!date && !!time && !hasConflict;

  return (
    <Modal isOpen={isOpen} onClose={closeNewSession} title="New Session" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Client search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {selectedClient ? (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                  style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                >
                  {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                </div>
              ) : (
                <SearchIcon />
              )}
            </div>
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (selectedClient) setSelectedClient(null);
              }}
              onFocus={() => {
                if (search.length >= 2 && !selectedClient) setShowDropdown(true);
              }}
              placeholder="Search client by name..."
              className="pl-9 pr-9"
            />
            {selectedClient && (
              <button
                type="button"
                onClick={handleClearClient}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: '#fff', border: '1px solid #EFE9F2' }}
                >
                  {clients.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No clients found for &ldquo;{search}&rdquo;
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {clients.map((client) => (
                        <li key={client.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectClient(client)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                              style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                            >
                              {client.firstName[0]}{client.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {client.firstName} {client.lastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {client.phoneNumber || client.email || 'No contact info'}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Therapist */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Therapist <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {selectedTherapist ? (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                  style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                >
                  {selectedTherapist.user?.firstName?.[0]}{selectedTherapist.user?.lastName?.[0]}
                </div>
              ) : (
                <SearchIcon />
              )}
            </div>
            <Input
              ref={therapistSearchRef}
              value={therapistSearch}
              onChange={(e) => {
                setTherapistSearch(e.target.value);
                if (selectedTherapist) {
                  setSelectedTherapist(null);
                  setTherapistId('');
                }
                setShowTherapistDropdown(true);
              }}
              onFocus={() => setShowTherapistDropdown(true)}
              placeholder="Select a therapist"
              className="pl-9 pr-9"
            />
            {selectedTherapist && (
              <button
                type="button"
                onClick={handleClearTherapist}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {showTherapistDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTherapistDropdown(false)} />
                <div
                  ref={therapistDropdownRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: '#fff', border: '1px solid #EFE9F2' }}
                >
                  {filteredTherapists.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No therapists found
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {filteredTherapists.map((t: any) => {
                        const name = t.user
                          ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim()
                          : 'Unknown';
                        return (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectTherapist(t)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                            >
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                                style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                              >
                                {t.user?.firstName?.[0]}{t.user?.lastName?.[0]}
                              </div>
                              <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <Select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            options={[
              { value: '30', label: '30 minutes' },
              { value: '60', label: '60 minutes' },
              { value: '90', label: '90 minutes' },
              { value: '120', label: '120 minutes' },
            ]}
          />
        </div>

        {/* Conflict warning */}
        {hasConflict && (
          <div className="rounded-lg p-3" style={{ background: '#FFF1F0', border: '1px solid #FFCCC7' }}>
            <p className="text-sm font-medium" style={{ color: '#CF1322' }}>
              {availabilityCheck?.message || 'This time slot is not available'}
            </p>
          </div>
        )}

        {/* Service + Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            {(services as any[]).length > 0 ? (
              <Select
                value={serviceId}
                onChange={(e) => {
                  const svc = (services as any[]).find((s: any) => s.id === e.target.value);
                  if (svc) {
                    setServiceId(svc.id);
                    setServiceType(svc.name);
                    setDuration(String(svc.duration));
                    if (!price) setPrice(String(svc.price));
                  } else {
                    setServiceId('');
                    setServiceType('');
                  }
                }}
                options={[
                  { value: '', label: 'Select a service...' },
                  ...(services as any[]).map((s: any) => ({ value: s.id, label: `${s.name} (${s.duration}min)` })),
                ]}
              />
            ) : (
              <Input
                placeholder="e.g., Deep Tissue"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <Textarea
            placeholder="Any notes or special instructions..."
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
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium" style={{ color: '#1E1830' }}>Send reminder on booking</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Notify the client when this session is created</p>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${sendReminder ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
              onClick={() => setSendReminder((v) => !v)}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sendReminder ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>

          <div className="border-t" style={{ borderColor: '#EFE9F2' }} />

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium" style={{ color: '#1E1830' }}>Virtual session</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>Create a secure video consultation link</p>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isVirtual ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
              onClick={() => setIsVirtual((v) => !v)}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isVirtual ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={closeNewSession}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit || createAppointment.isPending}
          >
            {createAppointment.isPending ? 'Booking...' : 'Book Session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
