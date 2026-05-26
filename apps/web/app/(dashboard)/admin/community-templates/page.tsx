'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Modal } from '@massage/ui';
import { CheckCircle, XCircle, Clock, Globe } from 'lucide-react';
import { useAdminCommunityTemplates, useModerateTemplate } from '@/lib/hooks/use-note-templates';
import { CommunityTemplate, CommunityTemplateStatus } from '@massage/types';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL', label: 'All' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Massage: 'bg-purple-100 text-purple-700',
  Chiro: 'bg-blue-100 text-blue-700',
  Physio: 'bg-green-100 text-green-700',
  General: 'bg-gray-100 text-gray-700',
};

function StatusBadge({ status }: { status: CommunityTemplateStatus }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium"><CheckCircle className="h-3 w-3" />Approved</span>;
  if (status === 'REJECTED') return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium"><XCircle className="h-3 w-3" />Rejected</span>;
  return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium"><Clock className="h-3 w-3" />Pending</span>;
}

function ModerationModal({
  template,
  onClose,
}: {
  template: CommunityTemplate | null;
  onClose: () => void;
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const moderate = useModerateTemplate();

  if (!template) return null;

  const handleApprove = async () => {
    await moderate.mutateAsync({ id: template.id, action: 'approve' });
    onClose();
  };

  const handleReject = async () => {
    await moderate.mutateAsync({ id: template.id, action: 'reject', rejectionReason });
    onClose();
  };

  const fields = Array.isArray(template.fields) ? template.fields : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[template.category] ?? 'bg-gray-100 text-gray-600'}`}>
          {template.category}
        </span>
        <span className="text-xs text-gray-500">{fields.length} fields</span>
      </div>

      {template.description && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">{template.description}</p>
      )}

      <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
        {fields.map((field: any, i: number) => (
          <div key={i} className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-700">{field.label || <span className="italic text-gray-400">Untitled</span>}</span>
            <div className="flex items-center gap-2">
              {field.required && <span className="text-xs text-red-500">Required</span>}
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{field.type}</span>
            </div>
          </div>
        ))}
      </div>

      {!showRejectForm ? (
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="primary"
            onClick={handleApprove}
            isLoading={moderate.isPending}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejectForm(true)}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason for rejection *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this template is being rejected..."
              rows={3}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowRejectForm(false)} className="flex-1">Back</Button>
            <Button
              variant="outline"
              onClick={handleReject}
              isLoading={moderate.isPending}
              disabled={!rejectionReason.trim()}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCommunityTemplatesPage() {
  const [activeStatus, setActiveStatus] = useState('PENDING');
  const [reviewingTemplate, setReviewingTemplate] = useState<CommunityTemplate | null>(null);

  const { data, isLoading } = useAdminCommunityTemplates(activeStatus);
  const templates = data?.templates ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#5D4AA8' }}>Admin</p>
        <h1 className="text-2xl font-semibold font-display flex items-center gap-2" style={{ color: '#1E1830' }}>
          <Globe className="h-6 w-6" style={{ color: '#5D4AA8' }} />
          Community Template Moderation
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve templates submitted by users for the community library.</p>
      </div>

      {/* Status tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Template list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No templates in this category.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-gray-400">{total} template{total !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-gray-900 text-sm">{template.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[template.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {template.category}
                        </span>
                        <StatusBadge status={template.status} />
                      </div>
                      {template.description && (
                        <p className="text-xs text-gray-500 mb-1 line-clamp-1">{template.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{Array.isArray(template.fields) ? template.fields.length : 0} fields</span>
                        <span>Submitted {new Date(template.createdAt).toLocaleDateString()}</span>
                        {template.status === 'REJECTED' && template.rejectionReason && (
                          <span className="text-red-400">Reason: {template.rejectionReason}</span>
                        )}
                      </div>
                    </div>
                    {template.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewingTemplate(template)}
                        className="shrink-0"
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewingTemplate}
        onClose={() => setReviewingTemplate(null)}
        title={reviewingTemplate ? `Review: ${reviewingTemplate.name}` : ''}
        size="md"
      >
        <ModerationModal
          template={reviewingTemplate}
          onClose={() => setReviewingTemplate(null)}
        />
      </Modal>
    </div>
  );
}
