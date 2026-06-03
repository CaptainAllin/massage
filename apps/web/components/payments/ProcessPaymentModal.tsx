'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';


export interface ProcessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessCash: (data: { paymentId: string; notes?: string }) => Promise<void>;
  onProcessCheque: (data: { paymentId: string; chequeNumber?: string; notes?: string }) => Promise<void>;
  paymentId: string;
  amount: number;
  currency: string;
}

export const ProcessPaymentModal: React.FC<ProcessPaymentModalProps> = ({
  isOpen,
  onClose,
  onProcessCash,
  onProcessCheque,
  paymentId,
  amount,
  currency,
}) => {
  const [method, setMethod] = useState<'cash' | 'cheque'>('cash');
  const [chequeNumber, setChequeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      if (method === 'cash') {
        await onProcessCash({ paymentId, notes: notes || undefined });
      } else {
        await onProcessCheque({
          paymentId,
          chequeNumber: chequeNumber || undefined,
          notes: notes || undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Payment"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Amount to process:</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${amount.toFixed(2)} {currency}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'cash' | 'cheque')}
            required
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'cheque', label: 'Cheque' },
            ]}
          />
        </div>

        {method === 'cheque' && (
          <Input
            label="Cheque Number"
            value={chequeNumber}
            onChange={(e) => setChequeNumber(e.target.value)}
            placeholder="Enter cheque number"
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this payment"
            rows={3}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
