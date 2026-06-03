'use client';

import React, { useState } from 'react';
import { Button } from '@massage/ui';
import { Send } from 'lucide-react';
import {
  useIntakeForms,
  useIntakeFormTemplates,
  useDeleteIntakeForm,
} from '@/lib/hooks/use-intake-forms';
import { IntakeFormsList } from '@/components/intake-forms/IntakeFormsList';
import { SendFormModal } from '@/components/intake-forms/SendFormModal';
import { ViewFormModal } from '@/components/intake-forms/ViewFormModal';
import { IntakeFormTemplate } from '@massage/types';

interface ClientIntakeFormsProps {
  clientId: string;
  clientName: string;
  businessId: string | undefined;
}

export const ClientIntakeForms: React.FC<ClientIntakeFormsProps> = ({
  clientId,
  clientName,
  businessId,
}) => {
  const { data: formsData, isLoading } = useIntakeForms(businessId, { clientId });
  const { data: templatesData } = useIntakeFormTemplates(businessId);
  const deleteForm = useDeleteIntakeForm(businessId);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [viewingForm, setViewingForm] = useState<any | null>(null);

  const forms = formsData?.data ?? [];
  const templates: IntakeFormTemplate[] = templatesData?.data ?? [];

  const handleCopyLink = (form: any) => {
    const link = `${window.location.origin}/forms/${form.id}`;
    navigator.clipboard.writeText(link);
  };

  const handleDelete = async (form: any) => {
    if (!confirm('Delete this intake form? This cannot be undone.')) return;
    await deleteForm.mutateAsync(form.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Intake Forms</h3>
        <Button variant="primary" size="sm" onClick={() => setIsSendModalOpen(true)}>
          <Send className="h-4 w-4 mr-2" />
          Send Form
        </Button>
      </div>

      <IntakeFormsList
        forms={forms}
        isLoading={isLoading}
        onView={setViewingForm}
        onDelete={handleDelete}
        onCopyLink={handleCopyLink}
        showClient={false}
      />

      <SendFormModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        clientId={clientId}
        clientName={clientName}
        businessId={businessId}
        templates={templates}
      />

      <ViewFormModal
        isOpen={!!viewingForm}
        onClose={() => setViewingForm(null)}
        form={viewingForm}
        businessId={businessId}
      />
    </div>
  );
};
