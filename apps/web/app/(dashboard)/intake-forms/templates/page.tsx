'use client';

import React, { useState, useRef } from 'react';
import { Button, Card, CardContent, Badge, Modal, Input, Textarea, Select } from '@massage/ui';
import { Plus, ArrowLeft, Trash2, ToggleLeft, ToggleRight, Star, Pencil, Eye } from 'lucide-react';
import { IntakeFormRenderer } from '@/components/intake-forms/IntakeFormRenderer';
import Link from 'next/link';
import {
  useIntakeFormTemplates,
  useCreateIntakeFormTemplate,
} from '@/lib/hooks/use-intake-forms';
import { IntakeFormTemplate, IntakeFormField } from '@massage/types';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'bodymap', label: 'Body Map' },
];

const DEFAULT_FIELDS: IntakeFormField[] = [
  { id: 'full_name', type: 'text', label: 'Full Name', required: true, order: 1 },
  { id: 'date_of_birth', type: 'date', label: 'Date of Birth', required: true, order: 2 },
  {
    id: 'health_concerns',
    type: 'textarea',
    label: 'Health Concerns / Reason for Visit',
    required: true,
    order: 3,
  },
  {
    id: 'pain_areas',
    type: 'bodymap',
    label: 'Mark Areas of Pain or Discomfort',
    required: false,
    order: 4,
  },
  {
    id: 'medical_conditions',
    type: 'textarea',
    label: 'Existing Medical Conditions',
    required: false,
    order: 5,
  },
  {
    id: 'medications',
    type: 'textarea',
    label: 'Current Medications',
    required: false,
    order: 6,
  },
  {
    id: 'allergies',
    type: 'text',
    label: 'Known Allergies',
    required: false,
    order: 7,
  },
  {
    id: 'pregnant',
    type: 'radio',
    label: 'Are you pregnant?',
    required: false,
    options: ['No', 'Yes', 'Unsure'],
    order: 8,
  },
  {
    id: 'consent',
    type: 'checkbox',
    label: 'Consent',
    required: true,
    options: ['I consent to receive treatment and understand the risks involved'],
    order: 9,
  },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TemplatesPage() {
  const businessId = useBusinessId();
  const { data, isLoading } = useIntakeFormTemplates(businessId);
  const createTemplate = useCreateIntakeFormTemplate(businessId);
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [fields, setFields] = useState<IntakeFormField[]>(DEFAULT_FIELDS);
  const [isDefault, setIsDefault] = useState(false);

  const [editTemplate, setEditTemplate] = useState<IntakeFormTemplate | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFields, setEditFields] = useState<IntakeFormField[]>([]);
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [previewTemplate, setPreviewTemplate] = useState<IntakeFormTemplate | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  const createFieldsEndRef = useRef<HTMLDivElement>(null);
  const editFieldsEndRef = useRef<HTMLDivElement>(null);

  const templates: IntakeFormTemplate[] = data?.data ?? [];

  const addField = () => {
    setFields([
      ...fields,
      {
        id: generateId(),
        type: 'text',
        label: '',
        required: false,
        order: fields.length + 1,
      },
    ]);
    setTimeout(() => createFieldsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
  };

  const updateField = (index: number, patch: Partial<IntakeFormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...patch };
    setFields(updated);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!templateName.trim()) return;
    await createTemplate.mutateAsync({
      name: templateName,
      description: templateDesc || undefined,
      fields,
      isDefault,
    });
    setIsCreateOpen(false);
    setTemplateName('');
    setTemplateDesc('');
    setFields(DEFAULT_FIELDS);
    setIsDefault(false);
  };

  const handleToggleActive = async (template: IntakeFormTemplate) => {
    await apiClient.patch(
      `/intake-form-templates/${template.id}?businessId=${businessId}`,
      { businessId, isActive: !template.isActive }
    );
    queryClient.invalidateQueries({ queryKey: ['intake-form-templates', businessId] });
  };

  const handleDelete = async (template: IntakeFormTemplate) => {
    if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
    await apiClient.delete(`/intake-form-templates/${template.id}?businessId=${businessId}`);
    queryClient.invalidateQueries({ queryKey: ['intake-form-templates', businessId] });
  };

  const openEdit = (template: IntakeFormTemplate) => {
    setEditTemplate(template);
    setEditName(template.name);
    setEditDesc(template.description ?? '');
    setEditFields(Array.isArray(template.fields) ? [...(template.fields as IntakeFormField[])] : []);
    setEditIsDefault(template.isDefault ?? false);
  };

  const updateEditField = (index: number, patch: Partial<IntakeFormField>) => {
    const updated = [...editFields];
    updated[index] = { ...updated[index], ...patch };
    setEditFields(updated);
  };

  const addEditField = () => {
    setEditFields([
      ...editFields,
      { id: generateId(), type: 'text', label: '', required: false, order: editFields.length + 1 },
    ]);
    setTimeout(() => editFieldsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
  };

  const removeEditField = (index: number) => {
    setEditFields(editFields.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editTemplate || !editName.trim()) return;
    setIsSaving(true);
    try {
      await apiClient.patch(
        `/intake-form-templates/${editTemplate.id}?businessId=${businessId}`,
        { businessId, name: editName, description: editDesc || undefined, fields: editFields, isDefault: editIsDefault }
      );
      queryClient.invalidateQueries({ queryKey: ['intake-form-templates', businessId] });
      setEditTemplate(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/intake-forms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Form Templates</h1>
            <p className="text-muted-foreground mt-1">Create reusable intake form templates</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="mb-4">No templates yet. Create your first intake form template.</p>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openEdit(template)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.isDefault && (
                        <Badge variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      <Badge variant={template.isActive ? 'success' : 'default'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {Array.isArray(template.fields) ? template.fields.length : 0} fields
                    </p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreviewValues({});
                        setPreviewTemplate(template);
                      }}
                      title="Preview form"
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(template)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(template)}
                      title={template.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {template.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Template Modal */}
      <Modal
        isOpen={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        title="Edit Template"
        size="lg"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g., New Client Intake, Follow-up Form"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editIsDefault}
              onChange={(e) => setEditIsDefault(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Set as default template</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Fields ({editFields.length})
              </label>
              <Button variant="outline" size="sm" onClick={addEditField}>
                <Plus className="h-3 w-3 mr-1" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {editFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={field.label}
                      onChange={(e) => updateEditField(index, { label: e.target.value })}
                      placeholder="Field label"
                      className="flex-1"
                    />
                    <Select
                      value={field.type}
                      onChange={(e) =>
                        updateEditField(index, {
                          type: e.target.value as IntakeFormField['type'],
                        })
                      }
                      options={FIELD_TYPES}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEditField(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateEditField(index, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>

                  {['select', 'radio', 'checkbox'].includes(field.type) && (
                    <div>
                      <Input
                        value={(field.options ?? []).join(', ')}
                        onChange={(e) =>
                          updateEditField(index, {
                            options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Options (comma-separated): Option 1, Option 2"
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={editFieldsEndRef} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t sticky bottom-0 bg-white">
            <Button variant="ghost" onClick={() => setEditTemplate(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              isLoading={isSaving}
              disabled={!editName.trim()}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Form Template"
        size="lg"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., New Client Intake, Follow-up Form"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Set as default template</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Fields ({fields.length})
              </label>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="h-3 w-3 mr-1" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Field label"
                      className="flex-1"
                    />
                    <Select
                      value={field.type}
                      onChange={(e) =>
                        updateField(index, {
                          type: e.target.value as IntakeFormField['type'],
                        })
                      }
                      options={FIELD_TYPES}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>

                  {['select', 'radio', 'checkbox'].includes(field.type) && (
                    <div>
                      <Input
                        value={(field.options ?? []).join(', ')}
                        onChange={(e) =>
                          updateField(index, {
                            options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Options (comma-separated): Option 1, Option 2"
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={createFieldsEndRef} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t sticky bottom-0 bg-white">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={createTemplate.isPending}
              disabled={!templateName.trim()}
            >
              Create Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate ? `Preview: ${previewTemplate.name}` : ''}
        size="lg"
      >
        <div className="space-y-2">
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This is a preview of how the form will appear to clients. Fields are interactive but won&apos;t be submitted.
          </p>
          {previewTemplate && (
            <IntakeFormRenderer
              fields={Array.isArray(previewTemplate.fields) ? (previewTemplate.fields as any[]) : []}
              values={previewValues}
              onChange={setPreviewValues}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
