'use client';

import React, { useState } from 'react';
import { Button } from '@massage/ui';
import { NoteTemplate } from '@massage/types';
import { useNoteTemplates } from '@/lib/hooks/use-note-templates';
import { useBusinessId } from '@/lib/hooks/use-business-id';

interface TemplatePickerModalProps {
  onSelect: (template: NoteTemplate | null) => void;
  onClose: () => void;
}

const CATEGORY_ORDER = ['General', 'Massage', 'Sports', 'Prenatal', 'Assessment', 'Chiro', 'Physio'];

const CATEGORY_COLORS: Record<string, string> = {
  General: 'bg-violet-100 text-violet-700',
  Massage: 'bg-blue-100 text-blue-700',
  Sports: 'bg-orange-100 text-orange-700',
  Prenatal: 'bg-pink-100 text-pink-700',
  Assessment: 'bg-emerald-100 text-emerald-700',
  Chiro: 'bg-amber-100 text-amber-700',
  Physio: 'bg-cyan-100 text-cyan-700',
};

export function TemplatePickerModal({ onSelect, onClose }: TemplatePickerModalProps) {
  const businessId = useBusinessId();
  const { data: templates = [], isLoading } = useNoteTemplates(businessId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = templates.filter(
    (t) =>
      !t.isArchived &&
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = CATEGORY_ORDER.reduce<Record<string, NoteTemplate[]>>((acc, cat) => {
    const items = filtered.filter((t) => t.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  // Catch any categories not in CATEGORY_ORDER
  filtered.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    if (!grouped[t.category].find((x) => x.id === t.id)) {
      grouped[t.category].push(t);
    }
  });

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;

  const handleConfirm = () => {
    onSelect(selectedTemplate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold" style={{ color: '#1E1830' }}>
            Choose a Note Template
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
            Select a template to pre-fill your note structure, or start blank.
          </p>
          <div className="mt-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No templates found.</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#7A7090' }}>
                  {category}
                </p>
                <div className="space-y-1">
                  {items.map((template) => {
                    const isSelected = selectedId === template.id;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedId(isSelected ? null : template.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-300'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                                isSelected ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{template.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {template.fields.length} fields
                                {template.isGlobal ? ' · Built-in' : ' · Custom'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              CATEGORY_COLORS[template.category] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {template.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={() => onSelect(null)}
            className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            Start without template
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!selectedId}
            >
              Use Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
