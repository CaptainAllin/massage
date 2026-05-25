'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';
import { Client } from '@massage/types';
import { useClients, useCreateClient } from '@/lib/hooks/use-clients';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useCreateAppointment, useCheckAvailability } from '@/lib/hooks/use-appointments';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { format } from 'date-fns';
import { useQuickCall } from './QuickCallContext';

type Step = 'search' | 'new-client' | 'call' | 'book';

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export function QuickCallModal() {
  const { isOpen, initialClientId, closeQuickCall } = useQuickCall();
  const businessId = useBusinessId();

  const [step, setStep] = useState<Step>('search');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // New client form
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Book appointment
  const [therapistId, setTherapistId] = useState('');
  const [apptDate, setApptDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [apptTime, setApptTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [serviceType, setServiceType] = useState('');
  const [price, setPrice] = useState('');

  const { data: clients = [] } = useClients(businessId, { search, limit: 8 } as any);
  const { data: therapists = [] } = useTherapists(businessId);
  const createClient = useCreateClient(businessId);
  const createAppointment = useCreateAppointment(businessId);

  const startTime = apptDate && apptTime ? new Date(`${apptDate}T${apptTime}`) : null;
  const endTime = startTime && duration
    ? new Date(startTime.getTime() + parseInt(duration) * 60000)
    : null;
  const { data: availability } = useCheckAvailability(therapistId, startTime, endTime);
  const hasConflict = !!availability && !availability.available;

  // Pre-select client if opened from client profile
  useEffect(() => {
    if (isOpen && initialClientId && clients.length > 0) {
      const found = clients.find((c) => c.id === initialClientId);
      if (found) {
        setSelectedClient(found);
        setStep('call');
        prependTimestamp();
      }
    }
  }, [isOpen, initialClientId, clients]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(reset, 300);
    }
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && step === 'search') {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  function reset() {
    setStep('search');
    setSearch('');
    setSelectedClient(null);
    setCallNotes('');
    setNewFirstName('');
    setNewLastName('');
    setNewPhone('');
    setTherapistId('');
    setApptDate(format(new Date(), 'yyyy-MM-dd'));
    setApptTime('09:00');
    setDuration('60');
    setServiceType('');
    setPrice('');
  }

  function prependTimestamp() {
    const ts = format(new Date(), 'MMM d, yyyy h:mm a');
    setCallNotes((prev) => {
      const header = `[${ts}]\n`;
      return prev ? `${header}${prev}` : header;
    });
  }

  function handleSelectClient(client: Client) {
    setSelectedClient(client);
    setStep('call');
    prependTimestamp();
  }

  async function handleCreateClient() {
    if (!newFirstName.trim() || !newLastName.trim()) return;
    try {
      const created = await createClient.mutateAsync({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        phoneNumber: newPhone.trim() || undefined,
      });
      setSelectedClient(created as Client);
      setStep('call');
      prependTimestamp();
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  }

  async function handleBookAppointment() {
    if (!businessId || !selectedClient || !therapistId || !apptDate || !apptTime) return;
    try {
      await createAppointment.mutateAsync({
        businessId,
        clientId: selectedClient.id,
        therapistId,
        startTime: `${apptDate}T${apptTime}`,
        duration: parseInt(duration),
        serviceType: serviceType || undefined,
        price: price ? parseFloat(price) : undefined,
        notes: callNotes || undefined,
      });
      closeQuickCall();
    } catch (err: any) {
      console.error('Failed to book appointment:', err);
    }
  }

  const titleMap: Record<Step, string> = {
    search: 'Quick Call Intake',
    'new-client': 'New Client',
    call: selectedClient
      ? `${selectedClient.firstName} ${selectedClient.lastName}`
      : 'Call Screen',
    book: 'Book Appointment',
  };

  return (
    <Modal isOpen={isOpen} onClose={closeQuickCall} title={titleMap[step]} size="md">
      {step === 'search' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Search for an existing client or create a new one.
          </p>

          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="pl-9"
            />
          </div>

          {/* Results */}
          {search.length >= 2 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {clients.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No clients found matching &ldquo;{search}&rdquo;
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {clients.map((client) => (
                    <li key={client.id}>
                      <button
                        onClick={() => handleSelectClient(client)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDE5F4] text-[#5D4AA8] text-sm font-semibold flex-shrink-0">
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
                        {client.lastVisitDate && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            Last: {format(new Date(client.lastVisitDate), 'MMM d')}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={closeQuickCall} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => setStep('new-client')}
              className="flex-1"
            >
              + New Client
            </Button>
          </div>
        </div>
      )}

      {step === 'new-client' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter the minimum info to log this call. You can complete the full profile later.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="Jane"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setStep('search')} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateClient}
              isLoading={createClient.isPending}
              disabled={!newFirstName.trim() || !newLastName.trim()}
              className="flex-1"
            >
              Create &amp; Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'call' && selectedClient && (
        <div className="space-y-4">
          {/* Client summary */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE5F4] text-[#5D4AA8] text-sm font-semibold flex-shrink-0">
              {selectedClient.firstName[0]}{selectedClient.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {selectedClient.firstName} {selectedClient.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {selectedClient.phoneNumber && (
                  <span className="mr-3">{selectedClient.phoneNumber}</span>
                )}
                {selectedClient.totalVisits !== undefined && (
                  <span>{selectedClient.totalVisits} visits</span>
                )}
              </p>
            </div>
            <button
              onClick={() => { setSelectedClient(null); setStep('search'); setCallNotes(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              Change
            </button>
          </div>

          {/* Call notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Call Notes
              </label>
              <button
                onClick={prependTimestamp}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Add timestamp
              </button>
            </div>
            <Textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Reason for call, services requested, follow-up needed..."
              rows={5}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={closeQuickCall} className="flex-1">
              Save &amp; Close
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep('book')}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <PhoneIcon />
              Book Appointment
            </Button>
          </div>
        </div>
      )}

      {step === 'book' && selectedClient && (
        <div className="space-y-4">
          {/* Client reminder */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <UserIcon />
            <span className="font-medium">
              {selectedClient.firstName} {selectedClient.lastName}
            </span>
          </div>

          {/* Therapist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Therapist <span className="text-red-500">*</span>
            </label>
            <Select
              value={therapistId}
              onChange={(e) => setTherapistId(e.target.value)}
              options={[
                { value: '', label: 'Select a therapist' },
                ...therapists.map((t: any) => ({
                  value: t.id,
                  label: t.user
                    ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim()
                    : 'Unknown',
                })),
              ]}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
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

          {/* Availability conflict */}
          {hasConflict && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">
                This time slot is not available — {availability?.message}
              </p>
            </div>
          )}

          {/* Service + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <Input
                placeholder="e.g., Deep Tissue"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
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

          {/* Notes preview */}
          {callNotes && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-200">
              <p className="font-medium text-gray-600 mb-1">Call notes will be saved to appointment:</p>
              <p className="line-clamp-2 whitespace-pre-line">{callNotes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setStep('call')} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleBookAppointment}
              isLoading={createAppointment.isPending}
              disabled={!therapistId || !apptDate || !apptTime || hasConflict}
              className="flex-1"
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
