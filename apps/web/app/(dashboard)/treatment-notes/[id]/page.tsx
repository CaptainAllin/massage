'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Skeleton } from '@massage/ui';
import { useTreatmentNote } from '@/lib/hooks';
import { BodyMapViewer } from '@/components/body-map';

export default function TreatmentNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const businessId = 'temp-business-id'; // TODO: Get from auth context

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
          <h1 className="text-3xl font-bold text-foreground font-display">SOAP Note</h1>
          <p className="text-muted-foreground mt-2">
            {noteData.client
              ? `${noteData.client.firstName} ${noteData.client.lastName}`
              : 'Unknown Client'}{' '}
            - {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button variant="primary">Edit</Button>
        </div>
      </div>

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
