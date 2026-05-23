'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, CardContent } from '@massage/ui';
import { IntakeFormRenderer } from '@/components/intake-forms/IntakeFormRenderer';
import { IntakeFormField } from '@massage/types';
import { CheckCircle, ClipboardList } from 'lucide-react';

interface FormData {
  id: string;
  formData: any;
  submittedAt: string;
  client: { id: string; firstName: string; lastName: string };
  template: {
    id: string;
    name: string;
    description: string | null;
    fields: IntakeFormField[];
  } | null;
}

export default function ClientIntakeFormPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/public/intake-forms/${formId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Form not found');
          return;
        }
        const formRecord: FormData = data.data;
        const existing = formRecord.formData as Record<string, any>;
        if (existing?._completed) {
          setSubmitted(true);
        }
        setForm(formRecord);
        // Pre-fill any existing values (excluding internal flags)
        const { _completed, ...prefill } = existing ?? {};
        setValues(prefill);
      } catch {
        setError('Failed to load form. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate required fields
    const fields: IntakeFormField[] = form.template?.fields ?? [];
    const missing = fields.filter((f) => f.required && !values[f.id]);
    if (missing.length > 0) {
      alert(`Please complete required fields: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/intake-forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: values }),
      });
      if (res.status === 409) {
        setSubmitted(true);
        return;
      }
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Loading form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Form Not Found</h2>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-500">
              Your intake form has been submitted successfully. Your therapist will review your
              information before your appointment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields: IntakeFormField[] = form?.template?.fields ?? [];
  const clientName = form
    ? `${form.client.firstName} ${form.client.lastName}`
    : '';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {form?.template?.name ?? 'Intake Form'}
          </h1>
          {form?.template?.description && (
            <p className="text-gray-500 mt-2">{form.template.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-1">For: {clientName}</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            {fields.length > 0 ? (
              <form onSubmit={handleSubmit}>
                <IntakeFormRenderer
                  fields={fields}
                  values={values}
                  onChange={setValues}
                  readOnly={false}
                />

                <div className="mt-8 pt-6 border-t">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={submitting}
                  >
                    Submit Intake Form
                  </Button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    Your information is kept confidential and used only for your treatment.
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>This form has no fields configured.</p>
                <p className="text-xs mt-1">Please contact your therapist for assistance.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
