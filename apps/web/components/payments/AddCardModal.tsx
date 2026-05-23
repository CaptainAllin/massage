'use client';

import React, { useState } from 'react';
import { Modal, Button } from '@massage/ui';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCreateSetupIntent, useSavePaymentMethod } from '@/lib/hooks/use-payments';

const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  : null;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  clientId: string;
  onSuccess?: () => void;
}

export function AddCardModal({ isOpen, onClose, businessId, clientId, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createSetupIntent = useCreateSetupIntent(businessId);

  const handleOpen = async () => {
    if (clientSecret) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await createSetupIntent.mutateAsync(clientId);
      setClientSecret(result.clientSecret);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to initialize card setup');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !clientSecret) handleOpen();
  }, [isOpen]);

  const handleClose = () => {
    setClientSecret(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Payment Method">
      {isLoading && <p className="text-sm text-gray-500 py-4 text-center">Initializing secure card entry…</p>}
      {error && <p className="text-sm text-red-600 py-4">{error}</p>}
      {clientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <SetupForm
            businessId={businessId}
            clientId={clientId}
            clientSecret={clientSecret}
            onSuccess={() => { handleClose(); onSuccess?.(); }}
            onClose={handleClose}
          />
        </Elements>
      )}
    </Modal>
  );
}

function SetupForm({
  businessId, clientId, onSuccess, onClose,
}: {
  businessId: string; clientId: string; clientSecret: string;
  onSuccess: () => void; onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const savePaymentMethod = useSavePaymentMethod(businessId);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setIsConfirming(true);

    const { setupIntent, error: stripeError } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Card setup failed');
      setIsConfirming(false);
      return;
    }

    if (setupIntent?.payment_method && typeof setupIntent.payment_method === 'string') {
      try {
        await savePaymentMethod.mutateAsync({ clientId, stripePaymentMethodId: setupIntent.payment_method });
      } catch (err) {
        console.error('[SavePaymentMethod]', err);
      }
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isConfirming}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isConfirming || !stripe}>
          {isConfirming ? 'Saving…' : 'Save Card'}
        </Button>
      </div>
    </form>
  );
}
