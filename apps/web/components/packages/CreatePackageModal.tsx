'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '@massage/ui';
import { CreatePackagePurchaseDto } from '@massage/types';
import { useClients } from '@/lib/hooks/use-clients';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreatePackagePurchaseDto) => Promise<void>;
  businessId: string | undefined;
}

export function CreatePackageModal({
  isOpen,
  onClose,
  onCreate,
  businessId,
}: CreatePackageModalProps) {
  const { data: clientsData } = useClients(businessId);
  const clients = (clientsData as any)?.clients ?? clientsData ?? [];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    clientId: '',
    name: '',
    description: '',
    totalSessions: '5',
    totalPrice: '',
    currency: 'USD',
    expirationDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.name || !form.totalSessions || !form.totalPrice) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onCreate({
        businessId: businessId!,
        clientId: form.clientId,
        name: form.name,
        description: form.description || undefined,
        totalSessions: parseInt(form.totalSessions),
        totalPrice: parseFloat(form.totalPrice),
        currency: form.currency,
        expirationDate: form.expirationDate || undefined,
      });
      setForm({
        clientId: '',
        name: '',
        description: '',
        totalSessions: '5',
        totalPrice: '',
        currency: 'USD',
        expirationDate: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = Array.isArray(clients)
    ? clients.map((c: any) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Session Package" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.12)', color: '#5D4AA8' }}
        >
          A <strong>package</strong> is a prepaid bundle of sessions purchased by a client.
          Sessions are deducted as appointments are completed.
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
          <Select
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            options={[{ value: '', label: '— Select a client —' }, ...clientOptions]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. 5-Session Wellness Pack"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Includes 5 x 60-min massages"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Sessions *</label>
            <Input
              type="number"
              value={form.totalSessions}
              onChange={(e) => setForm({ ...form, totalSessions: e.target.value })}
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Price ($) *</label>
            <Input
              type="number"
              value={form.totalPrice}
              onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
              placeholder="250.00"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
          <Input
            type="date"
            value={form.expirationDate}
            onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">Leave blank for no expiry.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Package'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
