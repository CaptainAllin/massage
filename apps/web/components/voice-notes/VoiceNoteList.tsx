'use client';

import { VoiceNote, VoiceNoteStatus } from '@massage/types';
import { Mic, Trash2, Download, FileText, Loader2 } from 'lucide-react';
import { Button, Badge, Card, CardContent } from '@massage/ui';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { useVoiceNoteDelete, useVoiceNoteDownload } from './hooks/useVoiceNotes';
import { useState } from 'react';

interface VoiceNoteListProps {
  voiceNotes: VoiceNote[];
  onSelect?: (voiceNote: VoiceNote) => void;
  onGenerateSOAP?: (voiceNote: VoiceNote) => void;
  showActions?: boolean;
}

export const VoiceNoteList: React.FC<VoiceNoteListProps> = ({
  voiceNotes,
  onSelect,
  onGenerateSOAP,
  showActions = true,
}) => {
  const deleteMutation = useVoiceNoteDelete();
  const downloadMutation = useVoiceNoteDownload();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (voiceNote: VoiceNote) => {
    if (confirm('Are you sure you want to delete this voice note?')) {
      await deleteMutation.mutateAsync(voiceNote.id);
    }
  };

  const handleDownload = async (voiceNote: VoiceNote) => {
    try {
      const url = await downloadMutation.mutateAsync(voiceNote.id);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusVariant = (status: VoiceNoteStatus | string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case VoiceNoteStatus.TRANSCRIBED: return 'success';
      case VoiceNoteStatus.TRANSCRIBING: return 'warning';
      case VoiceNoteStatus.UPLOADED: return 'warning';
      case VoiceNoteStatus.FAILED: return 'danger';
      default: return 'default';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (voiceNotes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mic className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Voice Notes Yet</h3>
            <p className="text-sm text-gray-500">Record your first voice note to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {voiceNotes.map((voiceNote) => {
        const isExpanded = expandedId === voiceNote.id;

        return (
          <Card
            key={voiceNote.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelect?.(voiceNote)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">Voice Note</h4>
                      <Badge variant={getStatusVariant(voiceNote.status)}>
                        {voiceNote.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(voiceNote.recordedAt)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>Duration: {formatDuration(voiceNote.audioDuration)}</span>
                    <span>Size: {(voiceNote.audioFileSize / 1024 / 1024).toFixed(2)} MB</span>
                    {voiceNote.transcriptionCost > 0 && (
                      <span>Cost: ${voiceNote.transcriptionCost.toFixed(3)}</span>
                    )}
                  </div>

                  {voiceNote.transcription && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{voiceNote.transcription}</p>
                    </div>
                  )}

                  {voiceNote.status === VoiceNoteStatus.TRANSCRIBING && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Transcribing...</span>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                      <VoiceNotePlayer audioUrl={voiceNote.audioFileUrl} />
                    </div>
                  )}

                  {showActions && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button onClick={() => toggleExpand(voiceNote.id)} variant="outline">
                        {isExpanded ? 'Hide' : 'Play'}
                      </Button>

                      {voiceNote.status === VoiceNoteStatus.TRANSCRIBED && onGenerateSOAP && (
                        <Button onClick={() => onGenerateSOAP(voiceNote)} variant="outline">
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Generate SOAP
                        </Button>
                      )}

                      <Button
                        onClick={() => handleDownload(voiceNote)}
                        variant="ghost"
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        onClick={() => handleDelete(voiceNote)}
                        variant="ghost"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
