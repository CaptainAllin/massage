'use client';

import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@massage/ui';
import { Edit, RefreshCw, Sparkles, DollarSign, Zap } from 'lucide-react';
import { AISummaryEditor } from './AISummaryEditor';

interface AISummaryMetadata {
  provider?: string;
  model?: string;
  tokens?: number;
  cost?: number;
  duration?: number;
}

interface AISummaryViewerProps {
  summary: string;
  metadata?: AISummaryMetadata;
  onRegenerate?: () => Promise<any>;
  onUpdate?: (newSummary: string) => Promise<any>;
  isRegenerating?: boolean;
  showMetadata?: boolean;
}

export function AISummaryViewer({
  summary,
  metadata,
  onRegenerate,
  onUpdate,
  isRegenerating = false,
  showMetadata = true,
}: AISummaryViewerProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (newSummary: string) => {
    if (onUpdate) {
      await onUpdate(newSummary);
    }
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      await onRegenerate();
    }
  };

  if (isEditing) {
    return (
      <AISummaryEditor
        initialSummary={summary}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">AI Summary</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            )}
            {onUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700 leading-relaxed">{summary}</p>

        {showMetadata && metadata && (
          <div className="flex items-center gap-4 pt-3 border-t text-sm text-gray-600">
            {metadata.provider && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Provider:</span>
                <span className="capitalize">{metadata.provider.toLowerCase()}</span>
              </div>
            )}
            {metadata.tokens && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{metadata.tokens.toLocaleString()} tokens</span>
              </div>
            )}
            {metadata.cost !== undefined && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>${metadata.cost.toFixed(4)}</span>
              </div>
            )}
            {metadata.duration && (
              <div className="flex items-center gap-1">
                <span>{(metadata.duration / 1000).toFixed(2)}s</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
