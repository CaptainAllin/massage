'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Textarea, Button, Input, DatePicker } from '@massage/ui';
import { BodyMapModal, BodyMapSelection } from '@/components/body-map';
import { AIEnhancedTextarea } from './AIEnhancedTextarea';
import { SOAPSection } from '@/lib/hooks/use-soap-assist';
import { AIFormatButton } from '@/components/ai';
import { useSOAPFormat } from '@/lib/hooks/use-soap-assist';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { VoiceRecorder } from '@/components/voice-notes/VoiceRecorder';
import { VoiceNoteList } from '@/components/voice-notes/VoiceNoteList';
import { VoiceToSOAPGenerator } from '@/components/voice-notes/VoiceToSOAPGenerator';
import { useVoiceNoteUpload, useVoiceNotes } from '@/components/voice-notes/hooks/useVoiceNotes';
import { VoiceNote } from '@massage/types';

export interface SOAPNoteData {
  subjectiveFindings: string;
  objectiveFindings: string;
  assessment: string;
  plan: string;
  areasWorked: string[];
  techniques: string[];
  sessionDuration: number | null;
  followUpDate: string;
  bodyMap?: {
    view: 'front' | 'back';
    selections: BodyMapSelection[];
    notes: string;
  };
}

export interface SOAPNoteEditorProps {
  initialData?: Partial<SOAPNoteData>;
  onSave: (data: SOAPNoteData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SOAPNoteEditor: React.FC<SOAPNoteEditorProps> = ({
  initialData = {},
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SOAPNoteData>({
    subjectiveFindings: initialData.subjectiveFindings || '',
    objectiveFindings: initialData.objectiveFindings || '',
    assessment: initialData.assessment || '',
    plan: initialData.plan || '',
    areasWorked: initialData.areasWorked || [],
    techniques: initialData.techniques || [],
    sessionDuration: initialData.sessionDuration || null,
    followUpDate: initialData.followUpDate || '',
    bodyMap: initialData.bodyMap,
  });

  const [bodyMapOpen, setBodyMapOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [showRawTextInput, setShowRawTextInput] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedVoiceNote, setSelectedVoiceNote] = useState<VoiceNote | null>(null);
  const [useAI, setUseAI] = useState(true); // Toggle AI assistance

  const formatToSOAP = useSOAPFormat();
  const uploadVoiceNote = useVoiceNoteUpload();
  const businessId = useBusinessId();

  // TODO: Get actual userId, therapistId, clientId, appointmentId from context/props
  const userId = 'temp-user-id';
  const therapistId = 'temp-therapist-id';
  const clientId = 'temp-client-id';
  const appointmentId = 'temp-appointment-id';

  // Fetch voice notes for this appointment
  const { data: voiceNotesData } = useVoiceNotes({
    appointmentId,
    businessId,
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  const handleFormatToSOAP = () => {
    if (!rawText.trim()) return;

    formatToSOAP.mutate(
      {
        rawText,
        userId,
      },
      {
        onSuccess: (data) => {
          setFormData({
            ...formData,
            subjectiveFindings: data.subjective,
            objectiveFindings: data.objective,
            assessment: data.assessment,
            plan: data.plan,
          });
          setShowRawTextInput(false);
          setRawText('');
        },
        onError: (error) => {
          console.error('Format error:', error);
        },
      }
    );
  };

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    try {
      await uploadVoiceNote.mutateAsync({
        audioFile: audioBlob,
        businessId,
        clientId,
        therapistId,
        appointmentId,
        audioDuration: duration,
      });
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Failed to upload voice note:', error);
    }
  };

  const handleGenerateSOAPFromVoice = (voiceNote: VoiceNote) => {
    setSelectedVoiceNote(voiceNote);
  };

  const handleSOAPGenerated = (soapSections: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  }) => {
    setFormData({
      ...formData,
      subjectiveFindings: soapSections.subjective,
      objectiveFindings: soapSections.objective,
      assessment: soapSections.assessment,
      plan: soapSections.plan,
    });
    setSelectedVoiceNote(null);
  };

  return (
    <div className="space-y-6">
      {/* AI Controls */}
      <div className="flex items-center justify-between bg-sage-50 p-4 rounded-lg border border-sage-200">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="w-4 h-4 text-sage-600 border-gray-300 rounded focus:ring-sage-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Enable AI Assistance
            </span>
          </label>
          {useAI && (
            <span className="text-xs text-sage-600 bg-sage-100 px-2 py-1 rounded">
              Real-time suggestions & improvements
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRawTextInput(!showRawTextInput)}
        >
          {showRawTextInput ? 'Hide' : 'Format Raw Text to SOAP'}
        </Button>
      </div>

      {/* Raw Text to SOAP Formatter */}
      {showRawTextInput && (
        <Card className="border-2 border-sage-300">
          <CardHeader>
            <CardTitle>Format Raw Notes to SOAP</CardTitle>
            <p className="text-sm text-gray-600">
              Paste your raw session notes below and AI will organize them into proper SOAP format
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your raw notes here... (e.g., 'Client came in with lower back pain, been having it for 2 weeks, worse when sitting...')"
              rows={6}
            />
            <AIFormatButton
              onFormat={handleFormatToSOAP}
              isLoading={formatToSOAP.isPending}
              disabled={!rawText.trim()}
            />
          </CardContent>
        </Card>
      )}

      {/* Voice Notes Section */}
      <Card className="border-2 border-blue-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voice Notes</CardTitle>
              <p className="text-sm text-gray-600">
                Record session notes using your voice and AI will transcribe and organize them
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            >
              {showVoiceRecorder ? 'Hide Recorder' : 'Record Voice Note'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Recorder */}
          {showVoiceRecorder && (
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onCancel={() => setShowVoiceRecorder(false)}
              maxDuration={600}
            />
          )}

          {/* Voice Note List */}
          {voiceNotesData?.data && voiceNotesData.data.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Recorded Notes ({voiceNotesData.data.length})
              </h4>
              <VoiceNoteList
                voiceNotes={voiceNotesData.data}
                onGenerateSOAP={handleGenerateSOAPFromVoice}
                showActions={true}
              />
            </div>
          )}

          {/* SOAP Generator for Selected Voice Note */}
          {selectedVoiceNote && (
            <div className="mt-4">
              <VoiceToSOAPGenerator
                voiceNote={selectedVoiceNote}
                onGenerated={handleSOAPGenerated}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subjective */}
      <Card>
        <CardHeader>
          <CardTitle>S - Subjective</CardTitle>
          <p className="text-sm text-gray-600">Patient's description of symptoms</p>
        </CardHeader>
        <CardContent>
          {useAI ? (
            <AIEnhancedTextarea
              value={formData.subjectiveFindings}
              onChange={(value) =>
                setFormData({ ...formData, subjectiveFindings: value })
              }
              section={SOAPSection.SUBJECTIVE}
              placeholder="What does the client report? Pain location, intensity, what makes it better/worse..."
              rows={5}
              userId={userId}
            />
          ) : (
            <Textarea
              value={formData.subjectiveFindings}
              onChange={(e) =>
                setFormData({ ...formData, subjectiveFindings: e.target.value })
              }
              placeholder="What does the client report? Pain location, intensity, what makes it better/worse..."
              rows={5}
            />
          )}
        </CardContent>
      </Card>

      {/* Objective */}
      <Card>
        <CardHeader>
          <CardTitle>O - Objective</CardTitle>
          <p className="text-sm text-gray-600">Observable and measurable findings</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {useAI ? (
            <AIEnhancedTextarea
              value={formData.objectiveFindings}
              onChange={(value) =>
                setFormData({ ...formData, objectiveFindings: value })
              }
              section={SOAPSection.OBJECTIVE}
              placeholder="Palpation findings, range of motion, posture observations..."
              rows={5}
              userId={userId}
            />
          ) : (
            <Textarea
              value={formData.objectiveFindings}
              onChange={(e) =>
                setFormData({ ...formData, objectiveFindings: e.target.value })
              }
              placeholder="Palpation findings, range of motion, posture observations..."
              rows={5}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body Map
            </label>
            <Button variant="outline" onClick={() => setBodyMapOpen(true)}>
              {formData.bodyMap ? 'Edit Body Map' : 'Add Body Map'}
            </Button>
            {formData.bodyMap && formData.bodyMap.selections.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {formData.bodyMap.selections.length} region(s) selected
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>A - Assessment</CardTitle>
          <p className="text-sm text-gray-600">Your professional evaluation</p>
        </CardHeader>
        <CardContent>
          {useAI ? (
            <AIEnhancedTextarea
              value={formData.assessment}
              onChange={(value) => setFormData({ ...formData, assessment: value })}
              section={SOAPSection.ASSESSMENT}
              placeholder="Clinical impressions, diagnosis, progress..."
              rows={5}
              userId={userId}
            />
          ) : (
            <Textarea
              value={formData.assessment}
              onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
              placeholder="Clinical impressions, diagnosis, progress..."
              rows={5}
            />
          )}
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle>P - Plan</CardTitle>
          <p className="text-sm text-gray-600">Treatment plan and recommendations</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {useAI ? (
            <AIEnhancedTextarea
              value={formData.plan}
              onChange={(value) => setFormData({ ...formData, plan: value })}
              section={SOAPSection.PLAN}
              placeholder="Treatment recommendations, home care, follow-up..."
              rows={5}
              userId={userId}
            />
          ) : (
            <Textarea
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              placeholder="Treatment recommendations, home care, follow-up..."
              rows={5}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Duration (minutes)
              </label>
              <Input
                type="number"
                value={formData.sessionDuration || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sessionDuration: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Date
              </label>
              <DatePicker
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
          Save SOAP Note
        </Button>
      </div>

      {/* Body Map Modal */}
      <BodyMapModal
        isOpen={bodyMapOpen}
        onClose={() => setBodyMapOpen(false)}
        onSave={(data) => setFormData({ ...formData, bodyMap: data })}
        initialView={formData.bodyMap?.view || 'front'}
        initialSelections={formData.bodyMap?.selections || []}
        initialNotes={formData.bodyMap?.notes || ''}
      />
    </div>
  );
};
