'use client';

import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Textarea } from '@massage/ui';
import { Save, X } from 'lucide-react';

interface AISummaryEditorProps {
  initialSummary: string;
  onSave: (summary: string) => Promise<any>;
  onCancel: () => void;
}

export function AISummaryEditor({
  initialSummary,
  onSave,
  onCancel,
}: AISummaryEditorProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(summary);
    } finally {
      setIsSaving(false);
    }
  };

  const characterCount = summary.length;
  const recommendedMax = 500;
  const isOverLimit = characterCount > recommendedMax;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Edit AI Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Enter summary..."
            rows={6}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className={isOverLimit ? 'text-red-600' : 'text-gray-500'}>
              {characterCount} / {recommendedMax} characters
              {isOverLimit && ' (over recommended limit)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !summary.trim()}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Summary'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
