'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import { MapPin, Plus, Edit2, Trash2, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/lib/hooks/use-locations';
import { useBusinessId } from '@/lib/hooks/use-business-id';

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
            <input required type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Main Street Studio" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input type="text" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input type="text" value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPrimary}
                onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">Primary location</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded" />
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

export default function LocationsPage() {
  const businessId = useBusinessId();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<any>(null);

  const { data: locations = [], isLoading } = useLocations(businessId);
  const deleteLocation = useDeleteLocation(businessId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Locations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your business locations</p>
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
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No locations yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first location to enable multi-location filtering</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(locations as any[]).map((loc: any) => (
            <Card key={loc.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
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
                    <Button variant="outline" size="sm" onClick={() => deleteLocation.mutate(loc.id)}>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isCreateOpen && businessId && (
        <LocationFormModal businessId={businessId} onClose={() => setIsCreateOpen(false)} />
      )}
      {editLocation && businessId && (
        <LocationFormModal businessId={businessId} location={editLocation} onClose={() => setEditLocation(null)} />
      )}
    </div>
  );
}
