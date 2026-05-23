'use client';

import React, { useState } from 'react';
import { Input, Textarea, Select, Checkbox, Radio } from '@massage/ui';
import { IntakeFormField } from '@massage/types';
import { BodyMapSelector, BodyMapSelection } from '@/components/body-map/BodyMapSelector';

interface IntakeFormRendererProps {
  fields: IntakeFormField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  readOnly?: boolean;
}

export const IntakeFormRenderer: React.FC<IntakeFormRendererProps> = ({
  fields,
  values,
  onChange,
  readOnly = false,
}) => {
  const sorted = [...fields].sort((a, b) => a.order - b.order);

  const setValue = (fieldId: string, value: any) => {
    onChange({ ...values, [fieldId]: value });
  };

  return (
    <div className="space-y-6">
      {sorted.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(val) => setValue(field.id, val)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};

interface FieldRendererProps {
  field: IntakeFormField;
  value: any;
  onChange: (value: any) => void;
  readOnly: boolean;
}

function FieldRenderer({ field, value, onChange, readOnly }: FieldRendererProps) {
  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <div>
          {label}
          <Input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={readOnly}
          />
        </div>
      );

    case 'date':
      return (
        <div>
          {label}
          <Input
            type="date"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          {label}
          <Textarea
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            disabled={readOnly}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <Select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            options={[
              { value: '', label: 'Select an option...' },
              ...(field.options || []).map((opt) => ({ value: opt, label: opt })),
            ]}
          />
        </div>
      );

    case 'radio':
      return (
        <div>
          {label}
          <Radio
            name={field.id}
            options={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
            value={value ?? ''}
            onChange={(val) => !readOnly && onChange(val)}
          />
        </div>
      );

    case 'checkbox':
      return (
        <div>
          {label}
          <div className="space-y-2 mt-1">
            {(field.options || []).map((opt) => {
              const checked = Array.isArray(value) ? value.includes(opt) : false;
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onChange={(e) => {
                      if (readOnly) return;
                      const current: string[] = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        onChange([...current, opt]);
                      } else {
                        onChange(current.filter((v) => v !== opt));
                      }
                    }}
                    disabled={readOnly}
                  />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      );

    case 'bodymap':
      return <BodyMapField field={field} value={value} onChange={onChange} readOnly={readOnly} />;

    default:
      return null;
  }
}

function BodyMapField({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: IntakeFormField;
  value: any;
  onChange: (value: any) => void;
  readOnly: boolean;
}) {
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const frontSelections: BodyMapSelection[] = value?.front ?? [];
  const backSelections: BodyMapSelection[] = value?.back ?? [];

  const handleFrontChange = (selections: BodyMapSelection[]) => {
    onChange({ ...value, front: selections });
  };

  const handleBackChange = (selections: BodyMapSelection[]) => {
    onChange({ ...value, back: selections });
  };

  const totalSelected = frontSelections.length + backSelections.length;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <p className="text-xs text-gray-500 mb-3">
        {readOnly
          ? `${totalSelected} area${totalSelected !== 1 ? 's' : ''} marked`
          : 'Click on body areas to indicate problem regions. Set pain level (0-10) for each.'}
      </p>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveView('front')}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
            activeView === 'front'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Front View {frontSelections.length > 0 && `(${frontSelections.length})`}
        </button>
        <button
          type="button"
          onClick={() => setActiveView('back')}
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
            activeView === 'back'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Back View {backSelections.length > 0 && `(${backSelections.length})`}
        </button>
      </div>

      {activeView === 'front' ? (
        <BodyMapSelector
          view="front"
          selectedRegions={frontSelections}
          onChange={handleFrontChange}
          readOnly={readOnly}
          showPainLevel
        />
      ) : (
        <BodyMapSelector
          view="back"
          selectedRegions={backSelections}
          onChange={handleBackChange}
          readOnly={readOnly}
          showPainLevel
        />
      )}

      {totalSelected > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <strong>Selected areas:</strong>{' '}
          {[...frontSelections, ...backSelections]
            .map((s) => `${s.regionName} (pain: ${s.painLevel}/10)`)
            .join(', ')}
        </div>
      )}
    </div>
  );
}
