'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent } from '@massage/ui';
import { Scissors, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Clock, DollarSign } from 'lucide-react';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/lib/hooks/use-services';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useIntakeFormTemplates } from '@/lib/hooks/use-intake-forms';
import { useNoteTemplates } from '@/lib/hooks/use-note-templates';

const DURATION_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '75 min', value: 75 },
  { label: '90 min', value: 90 },
  { label: '120 min', value: 120 },
];

const COLOR_SWATCHES = [
  '#5D4AA8', '#A8C3A0', '#E7D8C9', '#F4A261', '#2A9D8F',
  '#E76F51', '#457B9D', '#E9C46A', '#264653', '#8ECAE6',
];

const DEFAULT_FORM = {
  name: '',
  description: '',
  duration: 60,
  price: '',
  color: '#5D4AA8',
  isActive: true,
  defaultIntakeFormTemplateId: '',
  defaultNoteTemplateId: '',
};

function ServiceModal({
  businessId,
  service,
  onClose,
}: {
  businessId: string;
  service?: any;
  onClose: () => void;
}) {
  const isEdit = !!service;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: service.name,
          description: service.description ?? '',
          duration: service.duration,
          price: String(service.price),
          color: service.color ?? '#5D4AA8',
          isActive: service.isActive,
          defaultIntakeFormTemplateId: service.defaultIntakeFormTemplateId ?? '',
          defaultNoteTemplateId: service.defaultNoteTemplateId ?? '',
        }
      : { ...DEFAULT_FORM }
  );
  const [customDuration, setCustomDuration] = useState(!DURATION_PRESETS.find((p) => p.value === form.duration));
  const createService = useCreateService(businessId);
  const updateService = useUpdateService(businessId);
  const saving = createService.isPending || updateService.isPending;

  const { data: intakeTemplatesData } = useIntakeFormTemplates(businessId);
  const intakeTemplates = (intakeTemplatesData?.data ?? intakeTemplatesData ?? []) as any[];
  const { data: noteTemplates = [] } = useNoteTemplates(businessId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      duration: Number(form.duration),
      price: parseFloat(form.price as string),
      defaultIntakeFormTemplateId: form.defaultIntakeFormTemplateId || null,
      defaultNoteTemplateId: form.defaultNoteTemplateId || null,
    };
    if (isEdit) {
      await updateService.mutateAsync({ id: service.id, ...payload });
    } else {
      await createService.mutateAsync(payload);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFE9F2] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#1E1830]">{isEdit ? 'Edit Service' : 'Add Service'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]/30"
              placeholder="e.g., Deep Tissue Massage"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]/30"
              rows={2}
              placeholder="Brief description for clients..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setForm((f) => ({ ...f, duration: p.value })); setCustomDuration(false); }}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      !customDuration && form.duration === p.value
                        ? 'bg-[#5D4AA8] text-white border-[#5D4AA8]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#5D4AA8]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomDuration(true)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    customDuration ? 'bg-[#5D4AA8] text-white border-[#5D4AA8]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#5D4AA8]'
                  }`}
                >
                  Custom
                </button>
              </div>
              {customDuration && (
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]/30"
                  placeholder="Minutes"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value) || 60 }))}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]/30"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calendar Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Intake Form</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]/30"
              value={form.defaultIntakeFormTemplateId}
              onChange={(e) => setForm((f) => ({ ...f, defaultIntakeFormTemplateId: e.target.value }))}
            >
              <option value="">None</option>
              {intakeTemplates.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Auto-attached to new appointments for this service</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default SOAP Note Template</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]/30"
              value={form.defaultNoteTemplateId}
              onChange={(e) => setForm((f) => ({ ...f, defaultNoteTemplateId: e.target.value }))}
            >
              <option value="">None</option>
              {(noteTemplates as any[]).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Pre-selected when creating a treatment note for this service</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-[#5D4AA8]' : 'bg-gray-200'}`}
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-700">Active (available for booking)</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const businessId = useBusinessId();
  const { data: services = [], isLoading } = useServices(businessId);
  const updateService = useUpdateService(businessId);
  const deleteService = useDeleteService(businessId);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleEdit(service: any) {
    setEditingService(service);
    setShowModal(true);
  }

  function handleAdd() {
    setEditingService(null);
    setShowModal(true);
  }

  async function handleToggleActive(service: any) {
    await updateService.mutateAsync({ id: service.id, isActive: !service.isActive });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteService.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1830]">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage the treatments your business offers</p>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[#5D4AA8] border-t-transparent animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: '#EDE5F4' }}>
              <Scissors className="w-6 h-6 text-[#5D4AA8]" />
            </div>
            <h3 className="text-base font-semibold text-[#1E1830] mb-1">No services yet</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-xs">
              Add your first service to let clients book appointments and display your offerings on the booking page.
            </p>
            <Button variant="primary" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1.5" /> Add your first service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(services as any[]).map((service: any) => (
            <Card key={service.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div
                  className="w-3 h-12 rounded-full flex-shrink-0"
                  style={{ background: service.color ?? '#5D4AA8' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#1E1830] truncate">{service.name}</p>
                    {!service.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.duration} min</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${service.price.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className="text-gray-400 hover:text-[#5D4AA8] transition-colors"
                    title={service.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {service.isActive ? <ToggleRight className="w-5 h-5 text-[#5D4AA8]" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="text-gray-400 hover:text-[#5D4AA8] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    disabled={deletingId === service.id}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && businessId && (
        <ServiceModal
          businessId={businessId}
          service={editingService}
          onClose={() => { setShowModal(false); setEditingService(null); }}
        />
      )}
    </div>
  );
}
