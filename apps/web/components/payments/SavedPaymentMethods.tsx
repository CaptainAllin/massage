'use client';

import React, { useState } from 'react';
import { Card, CardContent, Button, Badge } from '@massage/ui';
import { CreditCard, Trash2, Star, Plus } from 'lucide-react';
import {
  useSavedPaymentMethods,
  useDeleteSavedPaymentMethod,
  useSetDefaultPaymentMethod,
} from '@/lib/hooks/use-payments';
import { AddCardModal } from './AddCardModal';

interface Props {
  businessId: string;
  clientId: string;
}

export function SavedPaymentMethods({ businessId, clientId }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: methods = [], isLoading, refetch } = useSavedPaymentMethods(businessId, clientId);
  const deleteMutation = useDeleteSavedPaymentMethod(businessId);
  const setDefaultMutation = useSetDefaultPaymentMethod(businessId);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this saved payment method?')) return;
    await deleteMutation.mutateAsync({ id, clientId });
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync({ id, clientId });
  };

  const cardBrandIcon = (brand: string | null) => {
    const b = (brand || '').toLowerCase();
    if (b === 'visa') return '💳 Visa';
    if (b === 'mastercard') return '💳 Mastercard';
    if (b === 'amex') return '💳 Amex';
    return '💳 Card';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-500" />
            Saved Payment Methods
          </h3>
          <Button
            variant="outline"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Card
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : methods.length === 0 ? (
          <p className="text-sm text-gray-500">No saved payment methods yet.</p>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {cardBrandIcon(method.brand)} ending in {method.last4}
                  </span>
                  <span className="text-xs text-gray-500">
                    Expires {method.expMonth}/{method.expYear}
                  </span>
                  {method.isDefault && (
                    <Badge variant="success">Default</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="ghost"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={setDefaultMutation.isPending}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(method.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AddCardModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          businessId={businessId}
          clientId={clientId}
          onSuccess={() => refetch()}
        />
      </CardContent>
    </Card>
  );
}
