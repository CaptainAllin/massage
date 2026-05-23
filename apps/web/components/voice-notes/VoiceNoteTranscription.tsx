'use client';

import { useState } from 'react';
import { VoiceNote, VoiceNoteStatus } from '@massage/types';
import { Loader2, FileText, DollarSign, Edit2, Check, X } from 'lucide-react';
import { Button, Textarea, Card, CardContent, CardHeader, CardTitle, Badge } from '@massage/ui';

interface VoiceNoteTranscriptionProps {
  voiceNote: VoiceNote;
  onEdit?: (newTranscription: string) => void;
  editable?: boolean;
}

export const VoiceNoteTranscription: React.FC<VoiceNoteTranscriptionProps> = ({
  voiceNote,
  onEdit,
  editable = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(voiceNote.transcription || '');

  const handleSave = () => {
    onEdit?.(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(voiceNote.transcription || '');
    setIsEditing(false);
  };

  if (voiceNote.status === VoiceNoteStatus.TRANSCRIBING) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transcribing Audio...</h3>
            <p className="text-sm text-gray-500">This usually takes a few seconds. Please wait.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (voiceNote.status === VoiceNoteStatus.FAILED) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transcription Failed</h3>
            <p className="text-sm text-gray-500">An error occurred while transcribing the audio. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!voiceNote.transcription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-8 w-8 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transcription Available</h3>
            <p className="text-sm text-gray-500">This voice note has not been transcribed yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Transcription</CardTitle>
            <Badge variant="default" className="ml-2">{voiceNote.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {voiceNote.transcriptionCost > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <DollarSign className="h-3.5 w-3.5" />
                <span>${voiceNote.transcriptionCost.toFixed(3)}</span>
              </div>
            )}
            {editable && !isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="ghost">
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedText(e.target.value)}
              rows={10}
              className="font-mono text-sm"
              placeholder="Edit transcription..."
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{voiceNote.transcription}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {voiceNote.transcribedAt && (
              <div>
                <span className="text-gray-500">Transcribed:</span>
                <span className="ml-2 text-gray-900">{new Date(voiceNote.transcribedAt).toLocaleString()}</span>
              </div>
            )}
            {voiceNote.audioDuration && (
              <div>
                <span className="text-gray-500">Duration:</span>
                <span className="ml-2 text-gray-900">
                  {Math.floor(voiceNote.audioDuration / 60)}:
                  {(voiceNote.audioDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
