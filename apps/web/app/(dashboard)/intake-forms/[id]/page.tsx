'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Badge, Skeleton } from '@massage/ui';
import { ArrowLeft, User, Calendar } from 'lucide-react';
import { useIntakeForm } from '@/lib/hooks/use-intake-forms';
import { IntakeFormRenderer } from '@/components/intake-forms/IntakeFormRenderer';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import type { IntakeFormField } from '@massage/types';

export default function IntakeFormDetailPage() {
  const params = useParams();
  const formId = params.id as string;
  const businessId = useBusinessId();
  const { data: form, isLoading } = useIntakeForm(formId, businessId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Intake form not found</p>
        <Link href="/intake-forms">
          <Button variant="outline" className="mt-4">Back to forms</Button>
        </Link>
      </div>
    );
  }

  const fields: IntakeFormField[] = ((form as any).template?.fields as IntakeFormField[]) ?? [];
  const formData = (form as any).formData ?? {};
  const hasAnswers = Object.keys(formData).filter(k => k !== '_completed').length > 0;
  const client = (form as any).client;
  const template = (form as any).template;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/intake-forms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">
            {template?.name ?? 'Intake Form'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Form submission details
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Client</p>
              <p className="font-medium text-sm">
                {client ? `${client.firstName} ${client.lastName}` : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Submitted</p>
              <p className="font-medium text-sm">
                {new Date((form as any).submittedAt).toLocaleDateString('en-AU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-5 w-5 flex items-center justify-center">
              <span className={`h-2.5 w-2.5 rounded-full ${hasAnswers ? 'bg-green-500' : 'bg-amber-400'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <Badge variant={hasAnswers ? 'success' : 'warning'}>
                {hasAnswers ? 'Completed' : 'Pending'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form responses */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Form Responses</h2>
          {!hasAnswers ? (
            <div className="text-center py-8 text-gray-400">
              <p>Client has not yet completed this form.</p>
              <a
                href={`/forms/${form.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline text-sm mt-2 block"
              >
                View client form link →
              </a>
            </div>
          ) : fields.length > 0 ? (
            <IntakeFormRenderer
              fields={fields}
              values={formData}
              onChange={() => {}}
              readOnly
            />
          ) : (
            <div className="space-y-2">
              {Object.entries(formData)
                .filter(([k]) => k !== '_completed')
                .map(([key, val]) => (
                  <div key={key} className="flex gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-600 min-w-48 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-gray-900">
                      {Array.isArray(val) ? val.join(', ') : String(val ?? '—')}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
