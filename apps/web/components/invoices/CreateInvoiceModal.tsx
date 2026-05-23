'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@massage/ui';
import { InvoiceLineItem, CreateInvoiceDto } from '@massage/types';
import { InvoiceLineItemsTable } from './InvoiceLineItemsTable';

export interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateInvoiceDto) => Promise<void>;
  businessId: string;
  clients: Array<{ id: string; firstName: string; lastName: string }>;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  businessId,
  clients,
}) => {
  const [clientId, setClientId] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [taxAmount, setTaxAmount] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New line item state
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnitPrice, setNewItemUnitPrice] = useState('');

  const handleAddLineItem = () => {
    if (!newItemDescription || !newItemUnitPrice) {
      setError('Please fill in all line item fields');
      return;
    }

    const quantity = parseFloat(newItemQuantity);
    const unitPrice = parseFloat(newItemUnitPrice);

    if (isNaN(quantity) || isNaN(unitPrice) || quantity <= 0 || unitPrice < 0) {
      setError('Please enter valid numbers');
      return;
    }

    const newItem: InvoiceLineItem = {
      description: newItemDescription,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };

    setLineItems([...lineItems, newItem]);
    setNewItemDescription('');
    setNewItemQuantity('1');
    setNewItemUnitPrice('');
    setError(null);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = parseFloat(taxAmount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    return subtotal + tax - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lineItems.length === 0) {
      setError('Please add at least one line item');
      return;
    }

    if (!clientId) {
      setError('Please select a client');
      return;
    }

    setIsProcessing(true);

    try {
      await onCreate({
        businessId,
        clientId,
        lineItems,
        taxAmount: parseFloat(taxAmount) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        notes: notes || undefined,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const clientOptions = [
    { value: '', label: 'Select a client' },
    ...clients.map((client) => ({
      value: client.id,
      label: `${client.firstName} ${client.lastName}`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invoice"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Line Items
          </h3>

          <div className="grid grid-cols-12 gap-3 mb-3">
            <div className="col-span-5">
              <Input
                label="Description"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Service description"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                label="Quantity"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                label="Unit Price"
                value={newItemUnitPrice}
                onChange={(e) => setNewItemUnitPrice(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="col-span-2 flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddLineItem}
                className="w-full"
              >
                Add
              </Button>
            </div>
          </div>

          <InvoiceLineItemsTable
            lineItems={lineItems}
            onRemove={handleRemoveLineItem}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Tax Amount"
            value={taxAmount}
            onChange={(e) => setTaxAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
          <Input
            type="number"
            label="Discount Amount"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Tax:</span>
            <span>${(parseFloat(taxAmount) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Discount:</span>
            <span>-${(parseFloat(discountAmount) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span>Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <Input
          type="date"
          label="Due Date (Optional)"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for this invoice"
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
            {isProcessing ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
