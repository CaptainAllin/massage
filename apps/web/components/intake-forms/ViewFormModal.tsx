'use client';

import React from 'react';
import { Modal, Button } from '@massage/ui';
import { IntakeFormField } from '@massage/types';
import { IntakeFormRenderer } from './IntakeFormRenderer';

interface ViewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    id: string;
    formData: any;
    submittedAt: string | Date;
    client?: { firstName: string; lastName: string };
    template?: { name: string; fields?: IntakeFormField[] } | null;
  } | null;
}

export const ViewFormModal: React.FC<ViewFormModalProps> = ({ isOpen, onClose, form }) => {
  if (!form) return null;

  const fields: IntakeFormField[] = (form.template?.fields as IntakeFormField[]) ?? [];
  const formData = (form.formData as Record<string, any>) ?? {};
  const { _completed, ...displayData } = formData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${form.client ? `${form.client.firstName} ${form.client.lastName} — ` : ''}${form.template?.name ?? 'Intake Form'}`}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Submitted {new Date(form.submittedAt).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {fields.length > 0 ? (
          <IntakeFormRenderer
            fields={fields}
            values={displayData}
            onChange={() => {}}
            readOnly
          />
        ) : (
          <div className="space-y-2">
            {Object.entries(displayData).map(([key, val]) => (
              <div key={key} className="flex gap-2 text-sm">
                <span className="font-medium text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="text-gray-900">
                  {Array.isArray(val) ? val.join(', ') : String(val ?? '-')}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
