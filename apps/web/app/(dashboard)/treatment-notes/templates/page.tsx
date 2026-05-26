'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Badge, Input, Modal } from '@massage/ui';
import { ArrowLeft, Plus, Copy, Pencil, Archive, ArchiveRestore, Trash2, GripVertical, Eye, X, Share2, Globe } from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import {
  useNoteTemplates,
  useCreateNoteTemplate,
  useUpdateNoteTemplate,
  useDeleteNoteTemplate,
  useDuplicateNoteTemplate,
  useShareTemplate,
} from '@/lib/hooks/use-note-templates';
import { NoteTemplate, NoteTemplateField, NoteTemplateFieldType, NoteTemplateCategory } from '@massage/types';

const CATEGORIES: NoteTemplateCategory[] = ['Massage', 'Chiro', 'Physio', 'General'];

const FIELD_TYPES: { value: NoteTemplateFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'scale', label: 'Scale (1–10)' },
  { value: 'body-map', label: 'Body Map' },
  { value: 'signature', label: 'Signature' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Massage: 'bg-purple-100 text-purple-700',
  Chiro: 'bg-blue-100 text-blue-700',
  Physio: 'bg-green-100 text-green-700',
  General: 'bg-gray-100 text-gray-700',
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const EMPTY_FIELD: () => NoteTemplateField & { _id: string } = () => ({
  _id: generateId(),
  label: '',
  type: 'text',
  required: false,
  placeholder: '',
});

type FieldWithId = NoteTemplateField & { _id: string };

function FieldPreview({ field }: { field: NoteTemplateField }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {field.label || <span className="italic text-gray-400">Untitled field</span>}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.type === 'text' && (
        <div className="h-8 bg-gray-100 rounded border border-gray-200 px-2 flex items-center text-xs text-gray-400">
          {field.placeholder || 'Text input'}
        </div>
      )}
      {field.type === 'checkbox' && (
        <label className="flex items-center gap-2 text-xs text-gray-500">
          <input type="checkbox" disabled className="rounded" />
          {field.placeholder || 'Checkbox option'}
        </label>
      )}
      {field.type === 'scale' && (
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="w-7 h-7 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500">
              {i + 1}
            </div>
          ))}
        </div>
      )}
      {field.type === 'body-map' && (
        <div className="h-20 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400">
          Body Map
        </div>
      )}
      {field.type === 'signature' && (
        <div className="h-16 bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
          Signature pad
        </div>
      )}
    </div>
  );
}

function TemplateBuilder({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<NoteTemplate>;
  onSave: (data: { name: string; category: string; fields: NoteTemplateField[] }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<string>(initial?.category ?? 'General');
  const [fields, setFields] = useState<FieldWithId[]>(
    initial?.fields
      ? (initial.fields as NoteTemplateField[]).map((f) => ({ ...f, _id: generateId() }))
      : [EMPTY_FIELD()]
  );
  const [showPreview, setShowPreview] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const addField = () => setFields((prev) => [...prev, EMPTY_FIELD()]);

  const updateField = (idx: number, patch: Partial<NoteTemplateField>) => {
    setFields((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const removeField = (idx: number) =>
    setFields((prev) => prev.filter((_, i) => i !== idx));

  const handleDragStart = (idx: number) => { dragIndex.current = idx; };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === idx) return;
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(idx, 0, moved);
      dragIndex.current = idx;
      return next;
    });
  };

  const handleSave = () => {
    const cleaned = fields.map(({ _id, ...f }) => f);
    onSave({ name, category, fields: cleaned });
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left: field list */}
      <div className="flex-1 space-y-4 min-w-0">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Template Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., SOAP Note" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Fields ({fields.length})</span>
            <Button variant="outline" size="sm" onClick={addField}>
              <Plus className="h-3 w-3 mr-1" />
              Add Field
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {fields.map((field, idx) => (
              <div
                key={field._id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                className="border border-gray-200 rounded-lg p-3 bg-white cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    placeholder="Field label"
                    className="flex-1 h-8 text-sm"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(idx, { type: e.target.value as NoteTemplateFieldType })}
                    className="h-8 rounded border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft.value} value={ft.value}>{ft.label}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => removeField(idx)}>
                    <X className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2 ml-6">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                      className="rounded"
                    />
                    Required
                  </label>
                  {(field.type === 'text') && (
                    <Input
                      value={field.placeholder ?? ''}
                      onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                      placeholder="Placeholder text"
                      className="flex-1 h-7 text-xs"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: preview pane */}
      {showPreview && (
        <div className="w-72 shrink-0 border-l border-gray-100 pl-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Preview</p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-sm font-semibold text-gray-800 mb-3">{name || 'Untitled Template'}</p>
            {fields.map((f) => (
              <FieldPreview key={f._id} field={f} />
            ))}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="absolute bottom-4 right-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)}>
          <Eye className="h-4 w-4 mr-1" />
          {showPreview ? 'Hide Preview' : 'Preview'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!name.trim()}
        >
          Save Template
        </Button>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onDuplicate,
  onEdit,
  onArchive,
  onDelete,
  onShare,
}: {
  template: NoteTemplate;
  onDuplicate: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}) {
  return (
    <Card className={template.isArchived ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm">{template.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[template.category] ?? 'bg-gray-100 text-gray-600'}`}>
                {template.category}
              </span>
              {template.isGlobal && (
                <Badge variant="default">Built-in</Badge>
              )}
              {template.isArchived && (
                <Badge variant="default">Archived</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Array.isArray(template.fields) ? template.fields.length : 0} fields
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate">
              <Copy className="h-4 w-4 text-gray-500" />
            </Button>
            {!template.isGlobal && (
              <>
                <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
                  <Pencil className="h-4 w-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onShare} title="Share to Community">
                  <Share2 className="h-4 w-4 text-purple-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onArchive} title={template.isArchived ? 'Restore' : 'Archive'}>
                  {template.isArchived ? (
                    <ArchiveRestore className="h-4 w-4 text-green-500" />
                  ) : (
                    <Archive className="h-4 w-4 text-amber-500" />
                  )}
                </Button>
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={onDelete} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NoteTemplatesPage() {
  const businessId = useBusinessId();
  const [activeTab, setActiveTab] = useState<'global' | 'custom'>('global');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);
  const [sharingTemplate, setSharingTemplate] = useState<NoteTemplate | null>(null);
  const [shareDescription, setShareDescription] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);

  const { data: allTemplates = [], isLoading } = useNoteTemplates(businessId, {
    includeArchived: showArchived,
  });

  const createTemplate = useCreateNoteTemplate(businessId);
  const updateTemplate = useUpdateNoteTemplate(businessId);
  const deleteTemplate = useDeleteNoteTemplate(businessId);
  const duplicateTemplate = useDuplicateNoteTemplate(businessId);
  const shareTemplate = useShareTemplate(businessId);

  const globalTemplates = allTemplates.filter((t) => t.isGlobal);
  const customTemplates = allTemplates.filter((t) => !t.isGlobal);

  const filtered = (list: NoteTemplate[]) =>
    categoryFilter === 'all' ? list : list.filter((t) => t.category === categoryFilter);

  const displayed = filtered(activeTab === 'global' ? globalTemplates : customTemplates);

  const handleSave = async (data: { name: string; category: string; fields: any[] }) => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, ...data });
    } else {
      await createTemplate.mutateAsync(data);
    }
    setIsBuilderOpen(false);
    setEditingTemplate(null);
  };

  const handleEdit = (template: NoteTemplate) => {
    setEditingTemplate(template);
    setIsBuilderOpen(true);
  };

  const handleDuplicate = async (template: NoteTemplate) => {
    await duplicateTemplate.mutateAsync(template);
    setActiveTab('custom');
  };

  const handleArchive = async (template: NoteTemplate) => {
    await updateTemplate.mutateAsync({ id: template.id, isArchived: !template.isArchived });
  };

  const handleDelete = async (template: NoteTemplate) => {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    await deleteTemplate.mutateAsync(template.id);
  };

  const handleShare = (template: NoteTemplate) => {
    setSharingTemplate(template);
    setShareDescription('');
    setShareSuccess(false);
  };

  const handleShareSubmit = async () => {
    if (!sharingTemplate) return;
    await shareTemplate.mutateAsync({ templateId: sharingTemplate.id, description: shareDescription });
    setShareSuccess(true);
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/treatment-notes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#5D4AA8' }}>Treatment Notes</p>
            <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830' }}>Note Templates</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/treatment-notes/templates/community">
            <Button variant="outline" size="sm">
              <Globe className="h-4 w-4 mr-1" />
              Community Library
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => { setEditingTemplate(null); setIsBuilderOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </div>
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['global', 'custom'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'global' ? `Global (${globalTemplates.length})` : `My Templates (${customTemplates.length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === 'all' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? `${CATEGORY_COLORS[cat]}`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Show archived
          </label>
        </div>
      </div>

      {/* Template list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-gray-500 mb-4">
              {activeTab === 'global'
                ? 'No global templates match the filter.'
                : 'No custom templates yet. Create one or duplicate a global template.'}
            </p>
            {activeTab === 'custom' && (
              <Button variant="primary" size="sm" onClick={() => { setEditingTemplate(null); setIsBuilderOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayed.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDuplicate={() => handleDuplicate(template)}
              onEdit={() => handleEdit(template)}
              onArchive={() => handleArchive(template)}
              onDelete={!template.isGlobal ? () => handleDelete(template) : undefined}
              onShare={!template.isGlobal ? () => handleShare(template) : undefined}
            />
          ))}
        </div>
      )}

      {/* Template Builder Modal */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => { setIsBuilderOpen(false); setEditingTemplate(null); }}
        title={editingTemplate ? `Edit: ${editingTemplate.name}` : 'New Note Template'}
        size="lg"
      >
        <div className="relative min-h-[480px] pb-16">
          <TemplateBuilder
            initial={editingTemplate ?? undefined}
            onSave={handleSave}
            onCancel={() => { setIsBuilderOpen(false); setEditingTemplate(null); }}
            isSaving={isSaving}
          />
        </div>
      </Modal>

      {/* Share to Community Modal */}
      <Modal
        isOpen={!!sharingTemplate}
        onClose={() => setSharingTemplate(null)}
        title="Share to Community Library"
        size="sm"
      >
        {shareSuccess ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Share2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium text-gray-900 mb-1">Submitted for review</p>
            <p className="text-sm text-gray-500">Your template will appear in the community library once approved by a moderator.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => setSharingTemplate(null)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share <span className="font-medium text-gray-900">"{sharingTemplate?.name}"</span> with the community. It will be reviewed before going live.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={shareDescription}
                onChange={(e) => setShareDescription(e.target.value)}
                placeholder="Briefly describe this template and when to use it..."
                rows={3}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSharingTemplate(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleShareSubmit}
                isLoading={shareTemplate.isPending}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Submit for Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
