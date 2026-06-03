'use client';

import React from 'react';
import { Card, CardContent, Badge, Button, EmptyState } from '@massage/ui';
import { ClipboardList, Pencil, Trash2, Link2 } from 'lucide-react';

interface IntakeFormItem {
  id: string;
  clientId: string;
  templateId: string | null;
  formData: any;
  submittedAt: string | Date;
  client?: { id: string; firstName: string; lastName: string; email: string };
  template?: { id: string; name: string } | null;
}

interface IntakeFormsListProps {
  forms: IntakeFormItem[];
  isLoading?: boolean;
  onView?: (form: IntakeFormItem) => void;
  onEdit?: (form: IntakeFormItem) => void;
  onDelete?: (form: IntakeFormItem) => void;
  onCopyLink?: (form: IntakeFormItem) => void;
  showClient?: boolean;
}

function isCompleted(formData: any): boolean {
  if (!formData) return false;
  const data = formData as Record<string, any>;
  return data._completed === true || Object.keys(data).filter((k) => k !== '_completed').length > 0;
}

export const IntakeFormsList: React.FC<IntakeFormsListProps> = ({
  forms,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onCopyLink,
  showClient = true,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-10 w-10" />}
        title="No intake forms yet"
        description="Create an intake form to collect client information before appointments."
      />
    );
  }

  return (
    <div className="space-y-3">
      {forms.map((form) => {
        const completed = isCompleted(form.formData);
        return (
          <Card
            key={form.id}
            className={completed && onView ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            onClick={completed && onView ? () => onView(form) : undefined}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {showClient && form.client && (
                      <span className="font-medium text-gray-900">
                        {form.client.firstName} {form.client.lastName}
                      </span>
                    )}
                    {form.template && (
                      <span className="text-sm text-gray-600">{form.template.name}</span>
                    )}
                    {!form.template && (
                      <span className="text-sm text-gray-400 italic">No template</span>
                    )}
                    <Badge variant={completed ? 'success' : 'warning'}>
                      {completed ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {completed ? 'Submitted' : 'Sent'}{' '}
                    {new Date(form.submittedAt).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  {!completed && onCopyLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onCopyLink(form); }}
                      title="Copy form link"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  )}
                  {completed && (onEdit ?? onView) && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); (onEdit ?? onView)!(form); }} title="Edit form">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDelete(form); }}
                      title="Delete form"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
