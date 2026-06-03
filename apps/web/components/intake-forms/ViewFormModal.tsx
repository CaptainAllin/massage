'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@massage/ui';
import { IntakeFormField } from '@massage/types';
import { IntakeFormRenderer } from './IntakeFormRenderer';
import { useUpdateIntakeForm } from '@/lib/hooks/use-intake-forms';
import { Pencil } from 'lucide-react';

interface ViewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
  startInEditMode?: boolean;
  form: {
    id: string;
    formData: any;
    submittedAt: string | Date;
    client?: { firstName: string; lastName: string };
    template?: { name: string; fields?: IntakeFormField[] } | null;
  } | null;
}

export const ViewFormModal: React.FC<ViewFormModalProps> = ({ isOpen, onClose, form, businessId, startInEditMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const updateForm = useUpdateIntakeForm(form?.id ?? '', businessId);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditValues({});
    } else if (startInEditMode && form) {
      const { _completed, ...data } = (form.formData as Record<string, any>) ?? {};
      setEditValues({ ...data });
      setIsEditing(true);
    }
  }, [isOpen, startInEditMode]);

  if (!form) return null;

  const fields: IntakeFormField[] = (form.template?.fields as IntakeFormField[]) ?? [];
  const formData = (form.formData as Record<string, any>) ?? {};
  const { _completed, ...displayData } = formData;

  const handleStartEdit = () => {
    setEditValues({ ...displayData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValues({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    await updateForm.mutateAsync({ ...editValues, _completed: true });
    setIsEditing(false);
  };

  const handleChange = (values: Record<string, any>) => {
    setEditValues(values);
  };

  const title = `${form.client ? `${form.client.firstName} ${form.client.lastName} — ` : ''}${form.template?.name ?? 'Intake Form'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
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
            values={isEditing ? editValues : displayData}
            onChange={isEditing ? handleChange : () => {}}
            readOnly={!isEditing}
          />
        ) : isEditing ? (
          <div className="space-y-3">
            {Object.entries(editValues).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={Array.isArray(val) ? val.join(', ') : String(val ?? '')}
                  onChange={(e) => handleChange({ ...editValues, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
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

        <div className="flex justify-between pt-4 border-t">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={handleCancel} disabled={updateForm.isPending}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={updateForm.isPending}>
                {updateForm.isPending ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleStartEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="primary" onClick={onClose} className="ml-auto">
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
