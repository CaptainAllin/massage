'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Select, Input } from '@massage/ui';
import { ArrowLeft, Send, Copy, Check } from 'lucide-react';
import { useIntakeFormTemplates, useCreateIntakeForm } from '@/lib/hooks/use-intake-forms';
import { useClients } from '@/lib/hooks/use-clients';
import { useBusinessId } from '@/lib/hooks/use-business-id';

export default function NewIntakeFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = useBusinessId();

  const preselectedClientId = searchParams.get('clientId') ?? '';

  const { data: templatesData } = useIntakeFormTemplates(businessId);
  const { data: clientsData } = useClients(businessId);
  const createForm = useCreateIntakeForm(businessId);

  const templates = (templatesData?.data ?? []) as any[];
  const clients = (clientsData ?? []) as any[];

  const [clientId, setClientId] = useState(preselectedClientId);
  const [templateId, setTemplateId] = useState('');
  const [formLink, setFormLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!clientId) return;
    const form = await createForm.mutateAsync({
      clientId,
      templateId: templateId || undefined,
      formData: {},
    });
    if (form?.id) {
      setFormLink(`${window.location.origin}/forms/${form.id}`);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeTemplates = templates.filter((t: any) => t.isActive);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/intake-forms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Send Intake Form</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create a form link to send to a client
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          {!formLink ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <Select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  options={[
                    { value: '', label: 'Select a client...' },
                    ...clients.map((c: any) => ({
                      value: c.id,
                      label: `${c.firstName} ${c.lastName}`,
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <Select
                  value={templateId}
                  onChange={e => setTemplateId(e.target.value)}
                  options={[
                    { value: '', label: 'Blank form (no template)' },
                    ...activeTemplates.map((t: any) => ({
                      value: t.id,
                      label: t.name + (t.isDefault ? ' (Default)' : ''),
                    })),
                  ]}
                />
                {activeTemplates.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No templates yet.{' '}
                    <Link href="/intake-forms/templates" className="underline">
                      Create a template first.
                    </Link>
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => router.push('/intake-forms')}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  disabled={!clientId}
                  isLoading={createForm.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800">Form created!</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Share this link with the client to complete.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Link</label>
                <div className="flex gap-2">
                  <Input value={formLink} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push('/intake-forms')}>
                  View All Forms
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFormLink('');
                    setClientId(preselectedClientId);
                    setTemplateId('');
                  }}
                >
                  Send Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
