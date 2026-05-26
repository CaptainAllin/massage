'use client';

import { TreatmentNoteStatus } from '@massage/types';

const statusConfig: Record<TreatmentNoteStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  PENDING_REVIEW: { label: 'In Review', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

export function NoteStatusBadge({ status }: { status: TreatmentNoteStatus }) {
  const config = statusConfig[status] ?? statusConfig.DRAFT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
