'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Checkbox, Select } from '@massage/ui';
import { CreateMembershipWithStripeDto } from '@massage/types';
import { useClients } from '@/lib/hooks/use-clients';
import { useBusiness } from '@/lib/hooks/use-business';

interface CreateMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateMembershipWithStripeDto) => Promise<void>;
  businessId: string | undefined;
}

export function CreateMembershipModal({
  isOpen,
  onClose,
  onCreate,
  businessId,
}: CreateMembershipModalProps) {
  const { data: business } = useBusiness(businessId);
  const currency = (business as any)?.currency || 'AUD';
  const { data: clients } = useClients(businessId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    price: '',
    sessionsPerMonth: '4',
    allowRollover: false,
    startDate: new Date().toISOString().split('T')[0],
    paymentMethodId: 'pm_card_visa', // Default mockup payment method
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.name || !formData.price || !formData.sessionsPerMonth) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreate({
        businessId: businessId!,
        clientId: formData.clientId,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        currency,
        sessionsPerMonth: parseInt(formData.sessionsPerMonth),
        allowRollover: formData.allowRollover,
        startDate: new Date(formData.startDate).toISOString(),
        paymentMethodId: formData.paymentMethodId,
      });
      // Reset form
      setFormData({
        clientId: '',
        name: '',
        description: '',
        price: '',
        sessionsPerMonth: '4',
        allowRollover: false,
        startDate: new Date().toISOString().split('T')[0],
        paymentMethodId: 'pm_card_visa',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create membership');
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = (clients || []).map((client) => ({
    value: client.id,
    label: `${client.firstName} ${client.lastName}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Client Membership"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client *
          </label>
          <Select
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            options={[
              { value: '', label: 'Select a client' },
              ...clientOptions,
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Membership Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Monthly Wellness Package"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ({currency}) *
            </label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="99.00"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. 4 massages per month"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sessions Per Month *
            </label>
            <Input
              type="number"
              value={formData.sessionsPerMonth}
              onChange={(e) => setFormData({ ...formData, sessionsPerMonth: e.target.value })}
              placeholder="4"
              required
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <Checkbox
            id="allowRollover"
            checked={formData.allowRollover}
            onChange={(checked) => setFormData({ ...formData, allowRollover: !!checked })}
            label="Allow rollover of unused sessions to next month"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method ID (Stripe) *
          </label>
          <Input
            value={formData.paymentMethodId}
            onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
            placeholder="pm_card_visa"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            Create Membership
          </Button>
        </div>
      </form>
    </Modal>
  );
}
