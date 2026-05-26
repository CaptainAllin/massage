'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Skeleton } from '@massage/ui';
import { useTreatmentNote } from '@/lib/hooks';
import { BodyMapViewer } from '@/components/body-map';
import { AISummarySection } from '@/components/ai';
import { NoteStatusBadge } from '@/components/treatment-notes/NoteStatusBadge';
import { SubmitForReviewModal } from '@/components/treatment-notes/SubmitForReviewModal';
import { ReviewActionModal } from '@/components/treatment-notes/ReviewActionModal';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useCurrentUser } from '@/lib/hooks/use-business';

export default function TreatmentNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const businessId = useBusinessId();

  const { data: note, isLoading, refetch } = useTreatmentNote(noteId, businessId);
  const { data: currentUser } = useCurrentUser();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  if (isLoading) {
    return <Skeleton variant="rectangular" height={600} />;
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Treatment note not found</p>
      </div>
    );
  }

  const noteData = note as any;
  const status = noteData.status ?? 'DRAFT';
  const isAuthor = noteData.therapist?.userId === currentUser?.id;
  const isReviewer = noteData.reviewerId === currentUser?.id;
  const isApproved = status === 'APPROVED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Practice</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>SOAP Note</h1>
            <NoteStatusBadge status={status} />
          </div>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>
            {noteData.client
              ? `${noteData.client.firstName} ${noteData.client.lastName}`
              : 'Unknown Client'}{' '}
            · {new Date(note.createdAt).toLocaleDateString()}
          </p>
          {noteData.noteTemplateName && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {noteData.noteTemplateName}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          {/* Author actions */}
          {isAuthor && (status === 'DRAFT' || status === 'REJECTED') && !isApproved && (
            <>
              <Button variant="outline" onClick={() => router.push(`/treatment-notes/${noteId}/edit`)}>
                Edit
              </Button>
              <Button variant="primary" onClick={() => setShowSubmitModal(true)}>
                Submit for Review
              </Button>
            </>
          )}
          {isAuthor && status === 'PENDING_REVIEW' && (
            <Button variant="outline" disabled>In Review</Button>
          )}
          {/* Reviewer actions */}
          {isReviewer && status === 'PENDING_REVIEW' && (
            <>
              <Button variant="danger" onClick={() => setReviewAction('reject')}>Reject</Button>
              <Button variant="primary" onClick={() => setReviewAction('approve')}>Approve</Button>
            </>
          )}
          {/* Non-author/non-reviewer editing */}
          {!isAuthor && !isReviewer && !isApproved && (
            <Button variant="primary">Edit</Button>
          )}
        </div>
      </div>

      {/* Review status info */}
      {(status === 'PENDING_REVIEW' || status === 'APPROVED' || status === 'REJECTED') && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                status === 'APPROVED' ? 'bg-green-500' : status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
              }`} />
              <div className="flex-1 min-w-0">
                {status === 'PENDING_REVIEW' && (
                  <p className="text-sm text-gray-700">
                    Submitted for review
                    {noteData.submittedForReviewAt && ` on ${new Date(noteData.submittedForReviewAt).toLocaleDateString()}`}
                    {noteData.reviewer && ` · Assigned to ${noteData.reviewer.firstName} ${noteData.reviewer.lastName}`}
                  </p>
                )}
                {status === 'APPROVED' && (
                  <p className="text-sm text-gray-700">
                    Approved
                    {noteData.reviewer && ` by ${noteData.reviewer.firstName} ${noteData.reviewer.lastName}`}
                    {noteData.reviewedAt && ` on ${new Date(noteData.reviewedAt).toLocaleDateString()}`}
                    <span className="ml-1 text-gray-500">· This note is locked</span>
                  </p>
                )}
                {status === 'REJECTED' && (
                  <div>
                    <p className="text-sm text-gray-700">
                      Returned for revision
                      {noteData.reviewer && ` by ${noteData.reviewer.firstName} ${noteData.reviewer.lastName}`}
                      {noteData.reviewedAt && ` on ${new Date(noteData.reviewedAt).toLocaleDateString()}`}
                    </p>
                    {noteData.reviewComment && (
                      <p className="mt-1.5 text-sm text-gray-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                        {noteData.reviewComment}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Summary Section */}
      <AISummarySection
        noteId={noteId}
        businessId={businessId}
        currentSummary={noteData.aiSummary || undefined}
      />

      {/* Subjective */}
      <Card>
        <CardHeader>
          <CardTitle>S - Subjective</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{note.subjectiveFindings || 'No data'}</p>
        </CardContent>
      </Card>

      {/* Objective */}
      <Card>
        <CardHeader>
          <CardTitle>O - Objective</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{note.objectiveFindings || 'No data'}</p>

          {noteData.bodyMaps && noteData.bodyMaps.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Body Map</h4>
              <BodyMapViewer
                view={noteData.bodyMaps[0].view}
                selections={noteData.bodyMaps[0].regions || []}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>A - Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{note.assessment || 'No data'}</p>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle>P - Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{note.plan || 'No data'}</p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-gray-600">Session Duration</p>
              <p className="text-gray-900">
                {note.sessionDuration ? `${note.sessionDuration} minutes` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Follow-up Date</p>
              <p className="text-gray-900">
                {note.followUpDate
                  ? new Date(note.followUpDate).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>

          {note.areasWorked && note.areasWorked.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Areas Worked</p>
              <div className="flex flex-wrap gap-2">
                {note.areasWorked.map((area: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {note.techniques && note.techniques.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Techniques Used</p>
              <div className="flex flex-wrap gap-2">
                {note.techniques.map((technique: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {technique}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showSubmitModal && businessId && (
        <SubmitForReviewModal
          noteId={noteId}
          businessId={businessId}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => refetch()}
        />
      )}
      {reviewAction && businessId && (
        <ReviewActionModal
          noteId={noteId}
          businessId={businessId}
          action={reviewAction}
          onClose={() => setReviewAction(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
