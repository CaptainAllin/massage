'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@massage/ui';
import { CheckCircle, AlertCircle, ClipboardList } from 'lucide-react';
import type { IntakeFormField } from '@massage/types';
import { IntakeFormRenderer } from '@/components/intake-forms/IntakeFormRenderer';

interface IntakeFormData {
  id: string;
  clientId: string;
  formData: Record<string, any>;
  submittedAt: string;
  client: { id: string; firstName: string; lastName: string } | null;
  template: {
    id: string;
    name: string;
    description: string | null;
    fields: IntakeFormField[];
  } | null;
}

export default function PublicIntakeFormPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<IntakeFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch(`/api/public/intake-forms/${formId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setForm(data.data);
          if (data.data.formData && Object.keys(data.data.formData).length > 0) {
            setAnswers(data.data.formData);
          }
        } else {
          setError('Form not found or no longer available.');
        }
      })
      .catch(() => setError('Failed to load form. Please try again.'))
      .finally(() => setLoading(false));
  }, [formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fields = form?.template?.fields ?? [];
    for (const field of fields) {
      if (field.required) {
        const val = answers[field.id];
        const empty =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);
        if (empty) {
          setError(`Please fill in: ${field.label}`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/intake-forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: answers }),
      });
      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your form...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Form Not Available</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500 mb-2">
            Your intake form has been submitted successfully.
          </p>
          <p className="text-sm text-gray-400">
            Your practitioner will review this before your appointment.
          </p>
        </div>
      </div>
    );
  }

  const fields = form?.template?.fields ?? [];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {form?.template?.name ?? 'Intake Form'}
              </h1>
              {form?.client && (
                <p className="text-sm text-gray-500">
                  For {form.client.firstName} {form.client.lastName}
                </p>
              )}
            </div>
          </div>
          {form?.template?.description && (
            <p className="text-gray-600 text-sm mt-2">{form.template.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            {fields.length === 0 ? (
              <p className="text-center text-gray-400">No fields configured for this form.</p>
            ) : (
              <IntakeFormRenderer
                fields={fields}
                values={answers}
                onChange={setAnswers}
                readOnly={false}
              />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Your information is securely stored and kept private.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
