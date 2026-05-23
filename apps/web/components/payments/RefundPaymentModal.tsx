'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@massage/ui';

export interface RefundPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefund: (data: { paymentId: string; amount?: number; reason?: string }) => Promise<void>;
  paymentId: string;
  maxAmount: number;
  currency: string;
}

export const RefundPaymentModal: React.FC<RefundPaymentModalProps> = ({
  isOpen,
  onClose,
  onRefund,
  paymentId,
  maxAmount,
  currency,
}) => {
  const [amount, setAmount] = useState(maxAmount.toString());
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPartialRefund = parseFloat(amount) < maxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const refundAmount = parseFloat(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (refundAmount > maxAmount) {
      setError(`Amount cannot exceed $${maxAmount.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);

    try {
      await onRefund({
        paymentId,
        amount: refundAmount,
        reason: reason || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Refund Payment"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Warning:</strong> This action cannot be undone. The refund will be processed immediately.
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Maximum refundable amount:</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ${maxAmount.toFixed(2)} {currency}
          </p>
        </div>

        <Input
          type="number"
          label="Refund Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          max={maxAmount}
          step="0.01"
          required
          placeholder="Enter refund amount"
        />

        {isPartialRefund && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This is a partial refund. ${(maxAmount - parseFloat(amount)).toFixed(2)} will remain.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason for Refund <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for this refund"
            rows={3}
            required
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
            variant="danger"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Refund $${parseFloat(amount).toFixed(2)}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
