'use client';

import React, { useState } from 'react';
import { Modal, Button, Select } from '@massage/ui';
import { IntakeFormTemplate } from '@massage/types';
import { useCreateIntakeForm } from '@/lib/hooks/use-intake-forms';
import { Check, Copy } from 'lucide-react';

interface SendFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  businessId: string | undefined;
  templates: IntakeFormTemplate[];
}

export const SendFormModal: React.FC<SendFormModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  businessId,
  templates,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createForm = useCreateIntakeForm(businessId);

  const activeTemplates = templates.filter((t) => t.isActive);

  const handleCreate = async () => {
    const form = await createForm.mutateAsync({
      clientId,
      templateId: selectedTemplateId || undefined,
      formData: {},
    });
    if (form?.id) setCreatedFormId(form.id);
  };

  const formLink = createdFormId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/forms/${createdFormId}`
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCreatedFormId(null);
    setSelectedTemplateId('');
    setCopied(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Intake Form" size="md">
      {!createdFormId ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Create an intake form for <strong>{clientName}</strong> and share the link with them to
            complete.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <Select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              options={[
                { value: '', label: 'No template (blank form)' },
                ...activeTemplates.map((t) => ({
                  value: t.id,
                  label: t.name + (t.isDefault ? ' (Default)' : ''),
                })),
              ]}
            />
            {activeTemplates.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No templates created yet. Create a template first to use structured forms.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={createForm.isPending}
            >
              Create Form & Get Link
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">Form created successfully!</p>
            <p className="text-xs text-green-700 mt-1">
              Share this link with {clientName} to complete the intake form.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formLink}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono"
              />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            The client can open this link on any device to complete the form. Once submitted, you'll
            see the responses in their profile.
          </p>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
