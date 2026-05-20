'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Textarea, Button, Input, DatePicker } from '@massage/ui';
import { BodyMapModal, BodyMapSelection } from '@/components/body-map';

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

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* Subjective */}
      <Card>
        <CardHeader>
          <CardTitle>S - Subjective</CardTitle>
          <p className="text-sm text-gray-600">Patient's description of symptoms</p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.subjectiveFindings}
            onChange={(e) =>
              setFormData({ ...formData, subjectiveFindings: e.target.value })
            }
            placeholder="What does the client report? Pain location, intensity, what makes it better/worse..."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Objective */}
      <Card>
        <CardHeader>
          <CardTitle>O - Objective</CardTitle>
          <p className="text-sm text-gray-600">Observable and measurable findings</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={formData.objectiveFindings}
            onChange={(e) =>
              setFormData({ ...formData, objectiveFindings: e.target.value })
            }
            placeholder="Palpation findings, range of motion, posture observations..."
            rows={5}
          />

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
          <Textarea
            value={formData.assessment}
            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
            placeholder="Clinical impressions, diagnosis, progress..."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle>P - Plan</CardTitle>
          <p className="text-sm text-gray-600">Treatment plan and recommendations</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            placeholder="Treatment recommendations, home care, follow-up..."
            rows={5}
          />

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
