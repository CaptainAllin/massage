'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Skeleton } from '@massage/ui';
import { useTreatmentNote } from '@/lib/hooks';
import { BodyMapViewer } from '@/components/body-map';
import { AISummarySection } from '@/components/ai';

import { useBusinessId } from '@/lib/hooks/use-business-id';
export default function TreatmentNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const businessId = useBusinessId();

  const { data: note, isLoading } = useTreatmentNote(noteId, businessId);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Practice</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>SOAP Note</h1>
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
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button variant="primary">Edit</Button>
        </div>
      </div>

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
                {note.areasWorked.map((area, idx) => (
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
                {note.techniques.map((technique, idx) => (
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
    </div>
  );
}
