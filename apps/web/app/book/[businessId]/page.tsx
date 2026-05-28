'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Calendar, Clock, ChevronLeft, Loader2, Users, User, RefreshCw, Lock, Mail, Phone } from 'lucide-react';

const RECURRING_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Types ────────────────────────────────────────────────────────────────────

type BookingAccessMode = 'PUBLIC' | 'EXISTING_CLIENTS_ONLY' | 'INVITE_ONLY';

interface Business {
  id: string;
  name: string;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  bookingMode: BookingAccessMode;
}

interface Therapist {
  id: string;
  bio: string | null;
  specializations: string[];
  user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface GroupSession {
  id: string;
  serviceType: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  price: number | null;
  capacity: number | null;
  spotsRemaining: number | null;
  therapist: { id: string; name: string } | null;
}

const SERVICE_TYPES = [
  'Swedish Massage',
  'Deep Tissue Massage',
  'Relaxation Massage',
  'Sports Massage',
  'Hot Stone Massage',
  'Remedial Massage',
  'Pregnancy Massage',
  'Aromatherapy Massage',
];

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '120 min', value: 120 },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateLong(date: Date) {
  return date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PublicBookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const businessId = params.businessId as string;
  const inviteToken = searchParams.get('token');

  const [step, setStep] = useState(1); // 1=therapist, 2=service, 3=datetime, 4=contact, 5=confirm
  const [business, setBusiness] = useState<Business | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; address?: string; city?: string }[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Access control state
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [gateEmail, setGateEmail] = useState('');
  const [gatePhone, setGatePhone] = useState('');

  // Selections
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedService, setSelectedService] = useState('Swedish Massage');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Invite token (stored for submission)
  const [activeInviteToken, setActiveInviteToken] = useState<string | null>(null);

  const [confirmedBooking, setConfirmedBooking] = useState<{ startTime: string; therapist: { firstName: string | null; lastName: string | null } } | null>(null);

  // Group session state
  const [bookingMode, setBookingMode] = useState<'individual' | 'group'>('individual');
  const [groupSessions, setGroupSessions] = useState<GroupSession[]>([]);
  const [groupSessionsLoading, setGroupSessionsLoading] = useState(false);
  const [selectedGroupSession, setSelectedGroupSession] = useState<GroupSession | null>(null);
  const [groupStep, setGroupStep] = useState<'select' | 'contact' | 'confirm'>('select');

  // Waitlist state
  const [waitlistStep, setWaitlistStep] = useState<'idle' | 'form' | 'success'>('idle');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  // Recurring booking state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'>('WEEKLY');
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringEndCondition, setRecurringEndCondition] = useState<'occurrences' | 'date'>('occurrences');
  const [recurringOccurrences, setRecurringOccurrences] = useState('8');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringPreviewDates, setRecurringPreviewDates] = useState<string[]>([]);

  // Load business + therapists, then handle access control
  useEffect(() => {
    fetch(`/api/public/booking/${businessId}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.success) { setError('This booking page is unavailable.'); return; }
        const biz: Business = d.data.business;
        setBusiness(biz);
        setTherapists(d.data.therapists);
        if (d.data.locations?.length > 1) setLocations(d.data.locations);

        if (biz.bookingMode === 'PUBLIC') {
          setAccessGranted(true);
        } else if (biz.bookingMode === 'INVITE_ONLY') {
          if (inviteToken) {
            // Validate token and pre-fill client details
            const vr = await fetch(`/api/public/booking/${businessId}/verify-invite?token=${inviteToken}`);
            const vd = await vr.json();
            if (vd.success && vd.data.valid) {
              setFirstName(vd.data.client.firstName || '');
              setLastName(vd.data.client.lastName || '');
              setEmail(vd.data.client.email || '');
              setPhone(vd.data.client.phone || '');
              setActiveInviteToken(inviteToken);
              setAccessGranted(true);
            } else {
              setError(vd.message || 'This invitation is invalid or has expired.');
            }
          }
          // else: no token → gate will show the "contact us" message
        }
        // EXISTING_CLIENTS_ONLY: gate stays, user enters email/phone manually
      })
      .catch(() => setError('Failed to load. Please try again.'))
      .finally(() => setLoading(false));
  }, [businessId, inviteToken]);

  // Load group sessions when mode switches to group
  useEffect(() => {
    if (bookingMode !== 'group' || !businessId) return;
    setGroupSessionsLoading(true);
    fetch(`/api/public/group-sessions/${businessId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setGroupSessions(d.data ?? []);
      })
      .catch(() => {})
      .finally(() => setGroupSessionsLoading(false));
  }, [bookingMode, businessId]);

  const handleGroupBook = async () => {
    if (!selectedGroupSession || !firstName || !lastName) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/public/group-sessions/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedGroupSession.id,
          clientFirstName: firstName,
          clientLastName: lastName,
          clientEmail: email || undefined,
          clientPhone: phone || undefined,
        }),
      });
      const d = await r.json();
      if (d.success) {
        setBooked(true);
        setConfirmedBooking({
          startTime: selectedGroupSession.startTime,
          therapist: { firstName: selectedGroupSession.therapist?.name ?? null, lastName: null },
        });
      } else {
        setError(d.message || 'Booking failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Load slots when therapist + date + duration change
  const loadSlots = useCallback(
    async (therapist: Therapist, date: Date, duration: number) => {
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const dateStr = toLocalDateString(date);
        const r = await fetch(
          `/api/public/booking/${businessId}/slots?therapistId=${therapist.id}&date=${dateStr}&duration=${duration}`
        );
        const d = await r.json();
        if (d.success) setSlots(d.data);
      } catch {
        // silently fail — slots will just be empty
      } finally {
        setSlotsLoading(false);
      }
    },
    [businessId]
  );

  useEffect(() => {
    if (selectedTherapist && selectedDate) {
      loadSlots(selectedTherapist, selectedDate, selectedDuration);
    }
  }, [selectedTherapist, selectedDate, selectedDuration, loadSlots]);

  // Load recurring preview dates
  useEffect(() => {
    if (!isRecurring || !selectedDate || !selectedSlot) return;
    if (recurringEndCondition === 'date' && !recurringEndDate) return;
    if (recurringEndCondition === 'occurrences' && (!recurringOccurrences || parseInt(recurringOccurrences) < 1)) return;

    const slotTime = new Date(selectedSlot.startTime).toTimeString().slice(0, 5);
    const body: any = {
      frequency: recurringFrequency,
      interval: 1,
      startDate: toLocalDateString(selectedDate),
      startTime: slotTime,
      ...(recurringEndCondition === 'occurrences'
        ? { occurrences: parseInt(recurringOccurrences) }
        : { endDate: recurringEndDate }),
    };
    if ((recurringFrequency === 'WEEKLY' || recurringFrequency === 'FORTNIGHTLY') && recurringDays.length > 0) {
      body.daysOfWeek = recurringDays;
    }

    const timeout = setTimeout(async () => {
      try {
        const r = await fetch('/api/recurring-appointments/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (d.success) setRecurringPreviewDates(d.data.dates.slice(0, 10));
      } catch {
        // silently fail
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [isRecurring, recurringFrequency, recurringDays, recurringEndCondition, recurringOccurrences, recurringEndDate, selectedDate, selectedSlot]);

  const handleBook = async () => {
    if (!selectedTherapist || !selectedSlot || !firstName || !lastName) return;
    setSubmitting(true);
    try {
      if (isRecurring) {
        const selectedDate2 = selectedDate ? toLocalDateString(selectedDate) : '';
        const slotTime = selectedSlot.startTime
          ? new Date(selectedSlot.startTime).toTimeString().slice(0, 5)
          : '09:00';
        const body: any = {
          therapistId: selectedTherapist.id,
          startDate: selectedDate2,
          startTime: slotTime,
          duration: selectedDuration,
          serviceType: selectedService,
          frequency: recurringFrequency,
          clientFirstName: firstName,
          clientLastName: lastName,
          clientEmail: email || undefined,
          clientPhone: phone || undefined,
          notes: notes || undefined,
          ...(recurringEndCondition === 'occurrences'
            ? { occurrences: parseInt(recurringOccurrences) }
            : { endDate: recurringEndDate }),
        };
        if (recurringFrequency === 'WEEKLY' || recurringFrequency === 'FORTNIGHTLY') {
          if (recurringDays.length > 0) body.daysOfWeek = recurringDays;
        }
        const r = await fetch(`/api/public/booking/${businessId}/recurring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (d.success) {
          setConfirmedBooking({
            startTime: d.data.firstAppointment.startTime,
            therapist: d.data.firstAppointment.therapist,
          });
          setBooked(true);
        } else {
          setError(d.error || d.message || 'Booking failed. Please try again.');
          setStep(3);
        }
      } else {
        const r = await fetch(`/api/public/booking/${businessId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            therapistId: selectedTherapist.id,
            startTime: selectedSlot.startTime,
            duration: selectedDuration,
            serviceType: selectedService,
            clientFirstName: firstName,
            clientLastName: lastName,
            clientEmail: email || undefined,
            clientPhone: phone || undefined,
            notes: notes || undefined,
            inviteToken: activeInviteToken || undefined,
          }),
        });
        const d = await r.json();
        if (d.success) {
          setConfirmedBooking(d.data);
          setBooked(true);
        } else {
          setError(d.error || 'Booking failed. Please try again.');
          setStep(3);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!firstName || !lastName || (!email && !phone)) return;
    setWaitlistSubmitting(true);
    try {
      const r = await fetch('/api/public/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          firstName,
          lastName,
          email: email || undefined,
          phoneNumber: phone || undefined,
          serviceType: selectedService || undefined,
          therapistId: selectedTherapist?.id || undefined,
        }),
      });
      const d = await r.json();
      if (d.success) {
        setWaitlistStep('success');
      } else {
        setError(d.error || 'Failed to join waitlist');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const accent = business?.primaryColor || '#A8C3A0';

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Page Unavailable</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // ── Booked confirmation ───────────────────────────────────────────────────

  if (booked && confirmedBooking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${accent}25` }}
          >
            <CheckCircle className="h-8 w-8" style={{ color: accent }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isRecurring ? 'Recurring Series Booked!' : 'Booking Confirmed!'}
          </h2>
          <p className="text-gray-500 mb-6">
            {isRecurring
              ? `Your recurring ${recurringFrequency.toLowerCase()} appointments at ${business?.name} have been scheduled.`
              : `Your appointment has been booked at ${business?.name}.`}
            {email && ' A confirmation email is on its way.'}
          </p>
          <div className="bg-gray-50 rounded-xl p-5 text-left text-sm space-y-2 mb-6">
            <p><span className="text-gray-400">Service</span><span className="float-right font-medium text-gray-800">{selectedService}</span></p>
            <p><span className="text-gray-400">Duration</span><span className="float-right font-medium text-gray-800">{selectedDuration} min</span></p>
            {isRecurring ? (
              <>
                <p><span className="text-gray-400">Repeats</span><span className="float-right font-medium text-gray-800 capitalize">{recurringFrequency.toLowerCase()}</span></p>
                <p><span className="text-gray-400">First session</span><span className="float-right font-medium text-gray-800">{formatTime(confirmedBooking.startTime)}, {formatDateLong(new Date(confirmedBooking.startTime))}</span></p>
              </>
            ) : (
              <p><span className="text-gray-400">Date & Time</span><span className="float-right font-medium text-gray-800">{formatTime(confirmedBooking.startTime)}, {formatDateLong(new Date(confirmedBooking.startTime))}</span></p>
            )}
            <p><span className="text-gray-400">Therapist</span><span className="float-right font-medium text-gray-800">{confirmedBooking.therapist.firstName} {confirmedBooking.therapist.lastName}</span></p>
          </div>
          <p className="text-xs text-gray-400">To cancel or reschedule, contact {business?.name} directly.</p>
        </div>
      </div>
    );
  }

  // ── Access gate for EXISTING_CLIENTS_ONLY ────────────────────────────────

  const handleVerifyClient = async () => {
    if (!gateEmail && !gatePhone) return;
    setAccessLoading(true);
    setAccessError(null);
    try {
      const r = await fetch(`/api/public/booking/${businessId}/verify-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gateEmail || undefined, phone: gatePhone || undefined }),
      });
      const d = await r.json();
      if (d.success && d.data.exists) {
        setEmail(gateEmail);
        setPhone(gatePhone);
        setAccessGranted(true);
      } else {
        setAccessError('We don\'t have a record matching those details. Please contact us to register as a new client.');
      }
    } catch {
      setAccessError('Verification failed. Please try again.');
    } finally {
      setAccessLoading(false);
    }
  };

  if (!accessGranted && business) {
    const isInviteOnly = business.bookingMode === 'INVITE_ONLY';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Header */}
          {business.logo && (
            <img src={business.logo} alt={business.name} className="h-10 mx-auto mb-4 object-contain" />
          )}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-5 w-5" style={{ color: accent }} />
            <h2 className="text-xl font-semibold text-gray-800">
              {isInviteOnly ? 'Invitation Required' : 'Existing Clients Only'}
            </h2>
          </div>
          {isInviteOnly ? (
            <div className="text-center">
              <p className="text-gray-500 text-sm mt-2 mb-6">
                Online booking at <strong>{business.name}</strong> is by invitation only.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                This booking link is invalid or has expired. Please contact <strong>{business.name}</strong> to receive a valid invitation.
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-sm mt-2 mb-6 text-center">
                Online booking at <strong>{business.name}</strong> is available to existing clients only. Enter your email or phone to continue.
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': accent } as any}
                  />
                </div>
                <div className="text-center text-xs text-gray-400">or</div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={gatePhone}
                    onChange={(e) => setGatePhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': accent } as any}
                  />
                </div>
                {accessError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {accessError}
                  </div>
                )}
                <button
                  onClick={handleVerifyClient}
                  disabled={accessLoading || (!gateEmail && !gatePhone)}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  {accessLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Continue'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalSteps = 5;
  const therapistName = selectedTherapist
    ? `${selectedTherapist.user.firstName} ${selectedTherapist.user.lastName}`
    : null;

  // ── Calendar strip for date picking ──────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  // Filter calendar days to days the therapist works
  const availableDayOfWeek = new Set(selectedTherapist?.availability.map((a) => a.dayOfWeek) ?? []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {business?.logo && (
            <img src={business.logo} alt={business.name} className="h-8 w-auto rounded-md object-contain" />
          )}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Book an appointment</p>
            <h1 className="text-lg font-bold text-gray-900">{business?.name}</h1>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-all"
                style={{ backgroundColor: i < step ? accent : '#e5e7eb' }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Step {step} of {totalSteps}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Booking Mode Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6 bg-white">
          <button
            onClick={() => { setBookingMode('individual'); setSelectedGroupSession(null); setGroupStep('select'); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
            style={{
              backgroundColor: bookingMode === 'individual' ? accent : 'transparent',
              color: bookingMode === 'individual' ? 'white' : '#6b7280',
            }}
          >
            <User size={15} />
            Individual
          </button>
          <button
            onClick={() => { setBookingMode('group'); setStep(1); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
            style={{
              backgroundColor: bookingMode === 'group' ? accent : 'transparent',
              color: bookingMode === 'group' ? 'white' : '#6b7280',
            }}
          >
            <Users size={15} />
            Group Sessions
          </button>
        </div>

        {/* Group Session Flow */}
        {bookingMode === 'group' && (
          <div>
            {groupStep === 'select' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Available Group Sessions</h2>
                <p className="text-sm text-gray-500 mb-5">Select a session to book your spot.</p>

                {groupSessionsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                  </div>
                ) : groupSessions.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                    <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No group sessions available right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupSessions.map((session) => {
                      const isFull = session.spotsRemaining !== null && session.spotsRemaining <= 0;
                      const isSelected = selectedGroupSession?.id === session.id;
                      return (
                        <button
                          key={session.id}
                          disabled={isFull}
                          onClick={() => setSelectedGroupSession(session)}
                          className="w-full text-left bg-white border-2 rounded-xl p-4 transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ borderColor: isSelected ? accent : '#e5e7eb' }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {session.serviceType ?? 'Group Session'}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {formatDateLong(new Date(session.startTime))} · {formatTime(session.startTime)}
                              </p>
                              {session.therapist && (
                                <p className="text-xs text-gray-400 mt-0.5">with {session.therapist.name}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {session.duration} min
                                </span>
                                {session.price != null && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    ${session.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {isFull ? (
                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">Full</span>
                              ) : (
                                <span
                                  className="text-xs font-semibold px-2 py-1 rounded-lg"
                                  style={{ background: `${accent}20`, color: accent }}
                                >
                                  {session.spotsRemaining != null
                                    ? `${session.spotsRemaining} spot${session.spotsRemaining === 1 ? '' : 's'} left`
                                    : 'Open'}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  disabled={!selectedGroupSession}
                  onClick={() => setGroupStep('contact')}
                  className="mt-6 w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: accent }}
                >
                  Continue
                </button>
              </div>
            )}

            {groupStep === 'contact' && (
              <div>
                <button onClick={() => setGroupStep('select')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Your Details</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Booking: <strong>{selectedGroupSession?.serviceType ?? 'Group Session'}</strong> · {formatTime(selectedGroupSession?.startTime ?? '')}
                </p>

                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">First Name *</label>
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Last Name *</label>
                      <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 400 000 000"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm mb-4">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  disabled={!firstName.trim() || !lastName.trim() || submitting}
                  onClick={handleGroupBook}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent }}
                >
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</> : 'Confirm Spot'}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  By confirming, you agree to the cancellation policy of {business?.name}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Individual booking steps */}
        {bookingMode === 'individual' && (
        <>

        {/* Step 1 — Choose Therapist */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Choose a Therapist</h2>
            <p className="text-sm text-gray-500 mb-5">Select who you'd like to see.</p>

            {/* Location filter (only shown when business has multiple locations) */}
            {locations.length > 1 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Filter by location</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedLocationId(null)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      background: !selectedLocationId ? accent : '#fff',
                      color: !selectedLocationId ? '#fff' : '#6B7280',
                      borderColor: !selectedLocationId ? accent : '#e5e7eb',
                    }}
                  >
                    All locations
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                      style={{
                        background: selectedLocationId === loc.id ? accent : '#fff',
                        color: selectedLocationId === loc.id ? '#fff' : '#6B7280',
                        borderColor: selectedLocationId === loc.id ? accent : '#e5e7eb',
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const visible = selectedLocationId
                ? therapists.filter((t: any) => t.location?.id === selectedLocationId)
                : therapists;
              if (visible.length === 0) {
                return <p className="text-gray-400 text-sm text-center py-10">No therapists available{selectedLocationId ? ' at this location' : ''}.</p>;
              }
              return (
              <div className="space-y-3">
                {visible.map((t) => {
                  const name = `${t.user.firstName} ${t.user.lastName}`;
                  const selected = selectedTherapist?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTherapist(t); setSelectedDate(null); setSelectedSlot(null); }}
                      className="w-full text-left bg-white border-2 rounded-xl p-4 transition-all hover:shadow-sm"
                      style={{ borderColor: selected ? accent : '#e5e7eb' }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden"
                          style={{ backgroundColor: accent }}
                        >
                          {t.user.profileImageUrl ? (
                            <img src={t.user.profileImageUrl} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{name}</p>
                          {t.specializations.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">{t.specializations.join(', ')}</p>
                          )}
                          {t.bio && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.bio}</p>
                          )}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {t.availability.map((a) => (
                              <span key={a.dayOfWeek} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                {DAY_NAMES[a.dayOfWeek]}
                              </span>
                            ))}
                          </div>
                        </div>
                        {selected && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: accent }}
                          >
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              );
            })()}

            <button
              disabled={!selectedTherapist}
              onClick={() => setStep(2)}
              className="mt-6 w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 — Service & Duration */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Select Service</h2>
            <p className="text-sm text-gray-500 mb-5">Choose your massage type and session length.</p>

            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Service Type</p>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedService(s)}
                    className="text-left px-3 py-2.5 rounded-lg border text-sm transition-all"
                    style={{
                      borderColor: selectedService === s ? accent : '#e5e7eb',
                      backgroundColor: selectedService === s ? `${accent}15` : 'white',
                      color: selectedService === s ? '#1a1a1a' : '#4b5563',
                      fontWeight: selectedService === s ? 600 : 400,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Duration</p>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className="text-center py-2.5 rounded-lg border text-sm font-medium transition-all"
                    style={{
                      borderColor: selectedDuration === d.value ? accent : '#e5e7eb',
                      backgroundColor: selectedDuration === d.value ? `${accent}15` : 'white',
                      color: selectedDuration === d.value ? '#1a1a1a' : '#4b5563',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: accent }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3 — Date & Time */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Date & Time</h2>
            <p className="text-sm text-gray-500 mb-5">
              Booking with <strong>{therapistName}</strong> · {selectedService} · {selectedDuration} min
            </p>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Calendar strip */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Select Date</p>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const isWorking = availableDayOfWeek.size === 0 || availableDayOfWeek.has(day.getDay());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      disabled={!isWorking}
                      onClick={() => { setSelectedDate(day); setSelectedSlot(null); setError(null); }}
                      className="flex flex-col items-center p-1.5 rounded-lg text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isSelected ? accent : isWorking ? '#f9fafb' : 'transparent',
                        color: isSelected ? 'white' : '#374151',
                      }}
                    >
                      <span className="font-medium">{DAY_NAMES[day.getDay()]}</span>
                      <span className="font-bold text-sm">{day.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Available Times — {formatDateLong(selectedDate)}
                  </p>
                </div>
                {slotsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-3">No available slots on this day.</p>
                    <button
                      onClick={() => setWaitlistStep('form')}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      Join Waitlist
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          disabled={!slot.available}
                          onClick={() => { setSelectedSlot(slot); setError(null); }}
                          className="py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{
                            borderColor: isSelected ? accent : slot.available ? '#e5e7eb' : '#f3f4f6',
                            backgroundColor: isSelected ? `${accent}15` : 'white',
                            color: isSelected ? '#1a1a1a' : '#374151',
                          }}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Recurring option (shown after slot selected) */}
            {selectedSlot && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-4">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" style={{ color: isRecurring ? accent : '#9ca3af' }} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Book as recurring series</p>
                      <p className="text-xs text-gray-400">Repeat this appointment regularly</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecurring((v) => !v);
                      if (!isRecurring && selectedDate) {
                        setRecurringDays([selectedDate.getDay()]);
                      }
                    }}
                    className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                    style={{ backgroundColor: isRecurring ? accent : '#e5e7eb' }}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </button>
                </label>

                {isRecurring && (
                  <div className="space-y-4 pt-2 border-t border-gray-50">
                    {/* Frequency */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Frequency</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['WEEKLY', 'FORTNIGHTLY', 'MONTHLY'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setRecurringFrequency(f)}
                            className="py-2 rounded-lg text-xs font-medium border transition-all"
                            style={{
                              borderColor: recurringFrequency === f ? accent : '#e5e7eb',
                              backgroundColor: recurringFrequency === f ? `${accent}15` : 'white',
                              color: recurringFrequency === f ? '#1a1a1a' : '#6b7280',
                            }}
                          >
                            {f === 'FORTNIGHTLY' ? 'Fortnightly' : f.charAt(0) + f.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Day picker for weekly/fortnightly */}
                    {(recurringFrequency === 'WEEKLY' || recurringFrequency === 'FORTNIGHTLY') && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Day(s)</label>
                        <div className="flex gap-1.5">
                          {RECURRING_DAY_LABELS.map((label, dow) => (
                            <button
                              key={dow}
                              type="button"
                              onClick={() => setRecurringDays((prev) =>
                                prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
                              )}
                              className="w-9 h-9 rounded-full text-xs font-medium transition-colors"
                              style={{
                                backgroundColor: recurringDays.includes(dow) ? accent : '#f3f4f6',
                                color: recurringDays.includes(dow) ? 'white' : '#374151',
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* End condition */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ends</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="publicEndCondition"
                            checked={recurringEndCondition === 'occurrences'}
                            onChange={() => setRecurringEndCondition('occurrences')}
                          />
                          <span className="text-sm text-gray-700">After</span>
                          <input
                            type="number"
                            min="1"
                            max="52"
                            value={recurringOccurrences}
                            onChange={(e) => setRecurringOccurrences(e.target.value)}
                            disabled={recurringEndCondition !== 'occurrences'}
                            className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-gray-400"
                          />
                          <span className="text-sm text-gray-700">sessions</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="publicEndCondition"
                            checked={recurringEndCondition === 'date'}
                            onChange={() => setRecurringEndCondition('date')}
                          />
                          <span className="text-sm text-gray-700">On date</span>
                          <input
                            type="date"
                            value={recurringEndDate}
                            onChange={(e) => setRecurringEndDate(e.target.value)}
                            disabled={recurringEndCondition !== 'date'}
                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-400"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Schedule preview */}
                    {recurringPreviewDates.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Your schedule ({recurringPreviewDates.length}+ sessions)
                        </label>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {recurringPreviewDates.slice(0, 8).map((iso, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                              {new Date(iso).toLocaleDateString('en-AU', {
                                weekday: 'short', day: 'numeric', month: 'short',
                              })}{' '}
                              at {new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              disabled={!selectedDate || !selectedSlot}
              onClick={() => setStep(4)}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 4 — Contact Details */}
        {step === 4 && (
          <div>
            <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Your Details</h2>
            <p className="text-sm text-gray-500 mb-5">We'll use this to confirm your booking.</p>

            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">First Name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Last Name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">Confirmation will be sent here.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+61 400 000 000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any health concerns, preferences, or areas to focus on..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                />
              </div>
            </div>

            <button
              disabled={!firstName.trim() || !lastName.trim()}
              onClick={() => setStep(5)}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              Review Booking
            </button>
          </div>
        )}

        {/* Step 5 — Review & Confirm */}
        {step === 5 && (
          <div>
            <button onClick={() => setStep(4)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Confirm</h2>
            <p className="text-sm text-gray-500 mb-5">Please check your details before confirming.</p>

            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  {therapistName?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{therapistName}</p>
                  <p className="text-xs text-gray-400">Therapist</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2">
                <p className="text-gray-400">Service</p>
                <p className="text-gray-800 font-medium text-right">{selectedService}</p>
                <p className="text-gray-400">Duration</p>
                <p className="text-gray-800 font-medium text-right">{selectedDuration} minutes</p>
                {isRecurring ? (
                  <>
                    <p className="text-gray-400">Repeats</p>
                    <p className="text-gray-800 font-medium text-right capitalize">{recurringFrequency.toLowerCase()}</p>
                    <p className="text-gray-400">Starting</p>
                    <p className="text-gray-800 font-medium text-right">{selectedDate ? formatDateLong(selectedDate) : ''}</p>
                    <p className="text-gray-400">Sessions</p>
                    <p className="text-gray-800 font-medium text-right">
                      {recurringEndCondition === 'occurrences' ? `${recurringOccurrences} sessions` : `Until ${recurringEndDate}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400">Date</p>
                    <p className="text-gray-800 font-medium text-right">{selectedDate ? formatDateLong(selectedDate) : ''}</p>
                    <p className="text-gray-400">Time</p>
                    <p className="text-gray-800 font-medium text-right">{selectedSlot ? formatTime(selectedSlot.startTime) : ''}</p>
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-gray-50 grid grid-cols-2 gap-y-2">
                <p className="text-gray-400">Name</p>
                <p className="text-gray-800 font-medium text-right">{firstName} {lastName}</p>
                {email && (
                  <>
                    <p className="text-gray-400">Email</p>
                    <p className="text-gray-800 font-medium text-right truncate">{email}</p>
                  </>
                )}
                {phone && (
                  <>
                    <p className="text-gray-400">Phone</p>
                    <p className="text-gray-800 font-medium text-right">{phone}</p>
                  </>
                )}
              </div>

              {notes && (
                <div className="pt-3 border-t border-gray-50">
                  <p className="text-gray-400 mb-1">Notes</p>
                  <p className="text-gray-600 text-xs">{notes}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              disabled={submitting}
              onClick={handleBook}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: accent }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              By confirming, you agree to the cancellation policy of {business?.name}.
            </p>
          </div>
        )}
        </>
        )}
      </div>

      {/* Waitlist overlay */}
      {waitlistStep === 'form' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Join the Waitlist</h3>
            <p className="text-sm text-gray-500 mb-4">
              We'll notify you when a slot opens for {selectedService || 'your preferred service'}.
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">First Name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Last Name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+61 400 000 000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setWaitlistStep('idle')}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinWaitlist}
                  disabled={waitlistSubmitting || !firstName || !lastName || (!email && !phone)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent }}
                >
                  {waitlistSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</> : 'Join Waitlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {waitlistStep === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${accent}25` }}
            >
              <CheckCircle className="h-7 w-7" style={{ color: accent }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">You're on the waitlist!</h3>
            <p className="text-sm text-gray-500 mb-6">
              We'll reach out as soon as a slot opens up for {selectedService || 'your preferred service'} at {business?.name}.
            </p>
            <button
              onClick={() => setWaitlistStep('idle')}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
