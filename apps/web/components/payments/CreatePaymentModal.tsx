'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '@massage/ui';
import { useClients } from '@/lib/hooks/use-clients';
import {
  useCreatePayment,
  useProcessStripePayment,
  useProcessCashPayment,
  useProcessCheckPayment,
  useSavedPaymentMethods,
} from '@/lib/hooks/use-payments';
import { StripePaymentModal } from './StripePaymentModal';
import { PaymentMethod } from '@massage/types';

export interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onSuccess?: () => void;
  defaultClientId?: string;
}

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
  isOpen,
  onClose,
  businessId,
  onSuccess,
  defaultClientId,
}) => {
  const [clientId, setClientId] = useState(defaultClientId || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<string>(PaymentMethod.STRIPE_CARD);
  const [description, setDescription] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeAmount, setStripeAmount] = useState(0);
  const [savedMethodId, setSavedMethodId] = useState<string>('new');

  const { data: clients } = useClients(businessId);
  const { data: savedMethods = [] } = useSavedPaymentMethods(businessId, clientId || undefined);
  const createPayment = useCreatePayment(businessId);
  const processStripe = useProcessStripePayment(businessId);
  const processCash = useProcessCashPayment(businessId);
  const processCheck = useProcessCheckPayment(businessId);

  const handleClose = () => {
    setClientId(defaultClientId || '');
    setAmount('');
    setMethod(PaymentMethod.STRIPE_CARD);
    setDescription('');
    setCheckNumber('');
    setError(null);
    setStripeClientSecret(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (!clientId) { setError('Please select a client'); return; }
    if (!amountNum || amountNum <= 0) { setError('Please enter a valid amount'); return; }

    setIsProcessing(true);
    try {
      const payment = await createPayment.mutateAsync({
        businessId,
        clientId,
        amount: amountNum,
        currency: 'USD',
        paymentMethod: method as any,
        description: description || undefined,
      });

      if (method === PaymentMethod.STRIPE_CARD) {
        const usingSavedMethod = savedMethodId !== 'new' && savedMethodId !== '';
        const result = await processStripe.mutateAsync({
          paymentId: payment!.id,
          ...(usingSavedMethod && { paymentMethodId: savedMethodId }),
        });
        const clientSecret = result?.data?.clientSecret;
        if (!clientSecret) throw new Error('Failed to initialize card payment');
        if (result?.data?.status === 'succeeded') {
          onSuccess?.();
          handleClose();
          return;
        }
        setStripeAmount(amountNum);
        setStripeClientSecret(clientSecret);
      } else if (method === PaymentMethod.CASH) {
        await processCash.mutateAsync({ paymentId: payment!.id });
        onSuccess?.();
        handleClose();
      } else if (method === PaymentMethod.CHECK) {
        await processCheck.mutateAsync({ paymentId: payment!.id, checkNumber: checkNumber || undefined });
        onSuccess?.();
        handleClose();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeSuccess = () => {
    setStripeClientSecret(null);
    onSuccess?.();
    handleClose();
  };

  const clientOptions = [
    { value: '', label: 'Select a client...' },
    ...(clients?.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })) || []),
  ];

  const isStripe = method === PaymentMethod.STRIPE_CARD;

  return (
    <>
      <Modal isOpen={isOpen && !stripeClientSecret} onClose={handleClose} title="Process Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!defaultClientId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

          <Input
            type="number"
            label="Amount (USD)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            required
            placeholder="0.00"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Method
            </label>
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={[
                { value: PaymentMethod.STRIPE_CARD, label: 'Credit / Debit Card (Stripe)' },
                { value: PaymentMethod.CASH, label: 'Cash' },
                { value: PaymentMethod.CHECK, label: 'Check' },
              ]}
            />
          </div>

          {method === PaymentMethod.CHECK && (
            <Input
              label="Check Number (optional)"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
              placeholder="e.g. 1042"
            />
          )}

          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Payment for services"
          />

          {isStripe && savedMethods.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Card on File
              </label>
              <Select
                value={savedMethodId}
                onChange={(e) => setSavedMethodId(e.target.value)}
                options={[
                  { value: 'new', label: 'Enter new card' },
                  ...savedMethods.map((m) => ({
                    value: m.stripePaymentMethodId,
                    label: `${m.brand ? m.brand.charAt(0).toUpperCase() + m.brand.slice(1) : 'Card'} ending in ${m.last4}${m.isDefault ? ' (default)' : ''}`,
                  })),
                ]}
              />
            </div>
          )}

          {isStripe && savedMethodId === 'new' && (
            <p className="text-xs text-gray-500">
              You will enter card details on the next screen.{' '}
              Test card: <span className="font-mono font-semibold">4242 4242 4242 4242</span>
              , any future date, any CVC.
            </p>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isProcessing}>
              {isProcessing
                ? 'Processing...'
                : isStripe && savedMethodId === 'new'
                ? 'Continue to Card Entry'
                : 'Process Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {stripeClientSecret && (
        <StripePaymentModal
          isOpen
          onClose={() => setStripeClientSecret(null)}
          clientSecret={stripeClientSecret}
          amount={stripeAmount}
          currency="USD"
          onSuccess={handleStripeSuccess}
        />
      )}
    </>
  );
};
