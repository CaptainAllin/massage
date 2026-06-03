'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import { MapPin, Plus, Edit2, Trash2, Star, ArrowLeft, Info, Users, X, Loader2, DoorOpen } from 'lucide-react';
import Link from 'next/link';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/lib/hooks/use-locations';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/lib/hooks/use-rooms';

// ─── Assign Therapists Modal ──────────────────────────────────────────────────

function AssignTherapistsModal({
  businessId,
  location,
  allTherapists,
  onClose,
}: {
  businessId: string;
  location: any;
  allTherapists: any[];
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const assignedIds = allTherapists
    .filter((t: any) => t.locationId === location.id)
    .map((t: any) => t.id);

  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds));

  const handleSave = async () => {
    setSaving(true);
    try {
      const toAdd = allTherapists.filter(
        (t: any) => selected.has(t.id) && t.locationId !== location.id
      );
      const toRemove = allTherapists.filter(
        (t: any) => !selected.has(t.id) && t.locationId === location.id
      );

      await Promise.all([
        ...toAdd.map((t: any) =>
          fetch(`/api/therapists/${t.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId, locationId: location.id }),
          })
        ),
        ...toRemove.map((t: any) =>
          fetch(`/api/therapists/${t.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessId, locationId: null }),
          })
        ),
      ]);

      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#EFE9F2' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#1E1830' }}>
              Assign Therapists to {location.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
              Assigned therapists appear in scheduling for this location.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
          {allTherapists.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#9E96B0' }}>
              No therapist profiles yet.{' '}
              <a href="/therapists" className="underline" style={{ color: '#5D4AA8' }}>
                Add therapists first.
              </a>
            </p>
          ) : (
            allTherapists.map((t: any) => {
              const u = t.user;
              const checked = selected.has(t.id);
              return (
                <label
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    background: checked ? '#F3EFFD' : '#FAFAFA',
                    border: `1px solid ${checked ? 'rgba(93,74,168,0.25)' : '#EFE9F2'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(t.id)}
                    className="w-4 h-4 accent-[#5D4AA8]"
                  />
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0"
                    style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                  >
                    {u?.firstName?.[0]}{u?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1E1830' }}>
                      {u?.firstName} {u?.lastName}
                    </p>
                    {t.specializations?.length > 0 && (
                      <p className="text-xs truncate" style={{ color: '#9E96B0' }}>
                        {t.specializations.slice(0, 2).join(', ')}
                        {t.specializations.length > 2 && ` +${t.specializations.length - 2}`}
                      </p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="p-5 border-t flex gap-3" style={{ borderColor: '#EFE9F2' }}>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save Assignment'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Location form modal ──────────────────────────────────────────────────────

function LocationFormModal({
  businessId,
  location,
  onClose,
}: {
  businessId: string;
  location?: any;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: location?.name ?? '',
    address: location?.address ?? '',
    city: location?.city ?? '',
    state: location?.state ?? '',
    postalCode: location?.postalCode ?? '',
    phoneNumber: location?.phoneNumber ?? '',
    email: location?.email ?? '',
    timezone: location?.timezone ?? '',
    isPrimary: location?.isPrimary ?? false,
    isActive: location?.isActive ?? true,
  });

  const createLocation = useCreateLocation(businessId);
  const updateLocation = useUpdateLocation(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (location) {
      await updateLocation.mutateAsync({ id: location.id, ...form });
    } else {
      await createLocation.mutateAsync(form);
    }
    onClose();
  };

  const isPending = createLocation.isPending || updateLocation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{location ? 'Edit Location' : 'Add Location'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              placeholder="Main Street Studio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              placeholder="123 Main St"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
            >
              <option value="">— Use business default —</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
              <option value="Australia/Melbourne">Australia/Melbourne (AEDT)</option>
              <option value="Australia/Brisbane">Australia/Brisbane (AEST)</option>
              <option value="Australia/Perth">Australia/Perth (AWST)</option>
              <option value="Australia/Adelaide">Australia/Adelaide (ACDT)</option>
              <option value="Pacific/Auckland">Pacific/Auckland (NZDT)</option>
              <option value="America/New_York">America/New_York (ET)</option>
              <option value="America/Chicago">America/Chicago (CT)</option>
              <option value="America/Denver">America/Denver (MT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
              <option value="America/Vancouver">America/Vancouver (PT)</option>
              <option value="America/Toronto">America/Toronto (ET)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                className="w-4 h-4 rounded accent-[#5D4AA8]"
              />
              <span className="text-sm text-gray-700">Primary location</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded accent-[#5D4AA8]"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : location ? 'Update Location' : 'Add Location'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Room form modal ──────────────────────────────────────────────────────────

const ROOM_COLORS = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6B7280', '#14B8A6',
];

function RoomFormModal({
  businessId,
  room,
  onClose,
}: {
  businessId: string;
  room?: any;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: room?.name ?? '',
    color: room?.color ?? '#8B5CF6',
    capacity: room?.capacity?.toString() ?? '1',
  });

  const createRoom = useCreateRoom(businessId);
  const updateRoom = useUpdateRoom(businessId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (room) {
      await updateRoom.mutateAsync({ id: room.id, ...form });
    } else {
      await createRoom.mutateAsync(form);
    }
    onClose();
  };

  const isPending = createRoom.isPending || updateRoom.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#EFE9F2' }}>
          <h2 className="text-base font-semibold" style={{ color: '#1E1830' }}>
            {room ? 'Edit Room' : 'Add Room'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              placeholder="e.g. Treatment Room 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {ROOM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-8 h-8 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? '#1E1830' : 'transparent',
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">Max number of clients in this room at once.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : room ? 'Update Room' : 'Add Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Rooms Section ────────────────────────────────────────────────────────────

function RoomsSection({ businessId }: { businessId: string }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<any>(null);

  const { data: rooms = [], isLoading } = useRooms(businessId);
  const deleteRoom = useDeleteRoom(businessId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#1E1830' }}>Rooms</h2>
          <p className="text-sm" style={{ color: '#7A7090' }}>
            Define treatment rooms and assign them to appointments.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Room
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading rooms…</div>
      ) : (rooms as any[]).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DoorOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">No rooms yet</p>
            <p className="text-gray-400 text-xs mt-1">Add rooms to assign them to appointments and availability rules.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(rooms as any[]).map((room: any) => (
            <div
              key={room.id}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ border: '1px solid #EFE9F2', background: room.isActive ? '#fff' : '#FAFAFA' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${room.color}20` }}
                >
                  <DoorOpen className="h-4 w-4" style={{ color: room.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: room.isActive ? '#1E1830' : '#9CA3AF' }}>
                    {room.name}
                  </p>
                  <p className="text-xs" style={{ color: '#9E96B0' }}>
                    Capacity: {room.capacity ?? 1}
                    {!room.isActive && ' · Archived'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setEditRoom(room)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {room.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Archive room "${room.name}"? It will no longer appear in appointment forms.`)) {
                        deleteRoom.mutate(room.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateOpen && (
        <RoomFormModal businessId={businessId} onClose={() => setIsCreateOpen(false)} />
      )}
      {editRoom && (
        <RoomFormModal businessId={businessId} room={editRoom} onClose={() => setEditRoom(null)} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'locations' | 'rooms';

export default function LocationsPage() {
  const businessId = useBusinessId();
  const [activeTab, setActiveTab] = useState<Tab>('locations');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<any>(null);
  const [assignLocation, setAssignLocation] = useState<any>(null);

  const { data: locations = [], isLoading } = useLocations(businessId);
  const { data: therapists = [] } = useTherapists(businessId);
  const deleteLocation = useDeleteLocation(businessId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Locations & Rooms</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your business locations and treatment rooms</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #EFE9F2' }}>
        <nav className="-mb-px flex gap-6">
          {([
            { id: 'locations' as Tab, label: 'Locations', icon: <MapPin className="h-4 w-4" /> },
            { id: 'rooms' as Tab, label: 'Rooms', icon: <DoorOpen className="h-4 w-4" /> },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
              style={
                activeTab === tab.id
                  ? { borderBottomColor: '#5D4AA8', color: '#5D4AA8' }
                  : { borderBottomColor: 'transparent', color: '#7A7090' }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'locations' && (
        <>
          {/* Multi-location info callout */}
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.15)' }}
          >
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#5D4AA8' }} />
            <div className="text-sm" style={{ color: '#5D4AA8' }}>
              <strong>Multi-location support</strong> lets you run multiple clinics or studios under one account.
              Each location has its own address, contact details, and assigned therapists. Appointments, invoices,
              and reports can be filtered by location throughout the app.
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Location
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (locations as any[]).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No locations yet</p>
                <p className="text-gray-400 text-sm mt-1">Add your first location to enable multi-location filtering</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(locations as any[]).map((loc: any) => {
                const assignedTherapists = (therapists as any[]).filter(
                  (t: any) => t.locationId === loc.id
                );
                return (
                  <Card key={loc.id}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 bg-[#EDE5F4] rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-[#5D4AA8]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                            <div className="flex gap-2 mt-0.5">
                              {loc.isPrimary && (
                                <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded">
                                  <Star className="w-3 h-3" /> Primary
                                </span>
                              )}
                              {!loc.isActive && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => setEditLocation(loc)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete location "${loc.name}"?`)) {
                                deleteLocation.mutate(loc.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        {loc.address && <p>{loc.address}</p>}
                        {(loc.city || loc.state) && (
                          <p>{[loc.city, loc.state, loc.postalCode].filter(Boolean).join(', ')}</p>
                        )}
                        {loc.phoneNumber && <p>{loc.phoneNumber}</p>}
                        {loc.email && <p>{loc.email}</p>}
                      </div>

                      {/* Assigned therapists */}
                      <div
                        className="rounded-lg p-3 space-y-2"
                        style={{ background: '#FAFAFA', border: '1px solid #EFE9F2' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" style={{ color: '#5D4AA8' }} />
                            <span className="text-xs font-medium" style={{ color: '#3D3450' }}>
                              Assigned Therapists
                            </span>
                          </div>
                          <button
                            onClick={() => setAssignLocation(loc)}
                            className="text-xs font-medium underline"
                            style={{ color: '#5D4AA8' }}
                          >
                            Manage
                          </button>
                        </div>
                        {assignedTherapists.length === 0 ? (
                          <p className="text-xs" style={{ color: '#9E96B0' }}>
                            No therapists assigned yet.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedTherapists.map((t: any) => (
                              <span
                                key={t.id}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                              >
                                {t.user?.firstName} {t.user?.lastName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'rooms' && businessId && (
        <RoomsSection businessId={businessId} />
      )}

      {isCreateOpen && businessId && (
        <LocationFormModal businessId={businessId} onClose={() => setIsCreateOpen(false)} />
      )}
      {editLocation && businessId && (
        <LocationFormModal businessId={businessId} location={editLocation} onClose={() => setEditLocation(null)} />
      )}
      {assignLocation && businessId && (
        <AssignTherapistsModal
          businessId={businessId}
          location={assignLocation}
          allTherapists={therapists as any[]}
          onClose={() => setAssignLocation(null)}
        />
      )}
    </div>
  );
}
