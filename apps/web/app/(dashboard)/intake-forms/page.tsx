'use client';

import React, { useState } from 'react';
import { Button, Input } from '@massage/ui';
import { LayoutTemplate, Search } from 'lucide-react';
import Link from 'next/link';
import { useIntakeForms, useDeleteIntakeForm } from '@/lib/hooks/use-intake-forms';
import { IntakeFormsList } from '@/components/intake-forms/IntakeFormsList';
import { ViewFormModal } from '@/components/intake-forms/ViewFormModal';
import { useBusinessId } from '@/lib/hooks/use-business-id';

export default function IntakeFormsPage() {
  const businessId = useBusinessId();
  const { data, isLoading } = useIntakeForms(businessId);
  const deleteForm = useDeleteIntakeForm(businessId);
  const [viewingForm, setViewingForm] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const allForms = data?.data ?? [];
  const forms = search
    ? allForms.filter((f: any) => {
        const name = `${f.client?.firstName ?? ''} ${f.client?.lastName ?? ''}`.toLowerCase();
        const template = (f.template?.name ?? '').toLowerCase();
        return name.includes(search.toLowerCase()) || template.includes(search.toLowerCase());
      })
    : allForms;

  const handleCopyLink = (form: any) => {
    const link = `${window.location.origin}/forms/${form.id}`;
    navigator.clipboard.writeText(link);
  };

  const handleDelete = async (form: any) => {
    if (!confirm('Delete this intake form? This cannot be undone.')) return;
    await deleteForm.mutateAsync(form.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Intake Forms</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2">
            Manage and review client intake forms
          </p>
        </div>
        <Link href="/intake-forms/templates">
          <Button variant="outline">
            <LayoutTemplate className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Manage Templates</span>
            <span className="sm:hidden">Templates</span>
          </Button>
        </Link>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or template..."
            className="pl-9"
          />
        </div>
      </div>

      <IntakeFormsList
        forms={forms}
        isLoading={isLoading}
        onView={setViewingForm}
        onDelete={handleDelete}
        onCopyLink={handleCopyLink}
        showClient
      />

      <ViewFormModal
        isOpen={!!viewingForm}
        onClose={() => setViewingForm(null)}
        form={viewingForm}
      />
    </div>
  );
}
