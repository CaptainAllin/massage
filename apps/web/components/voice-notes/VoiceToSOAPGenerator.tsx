'use client';

import { useState } from 'react';
import { VoiceNote, VoiceNoteStatus } from '@massage/types';
import { FileText, Wand2, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@massage/ui';
import { useVoiceToSOAP } from './hooks/useVoiceNotes';

interface VoiceToSOAPGeneratorProps {
  voiceNote: VoiceNote;
  onGenerated: (soapSections: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  }) => void;
}

export const VoiceToSOAPGenerator: React.FC<VoiceToSOAPGeneratorProps> = ({
  voiceNote,
  onGenerated,
}) => {
  const [provider, setProvider] = useState<'openai' | 'claude'>('openai');
  const generateMutation = useVoiceToSOAP();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        voiceNoteId: voiceNote.id,
        provider,
      });

      if (result.success && result.data) {
        onGenerated({
          subjective: result.data.subjective,
          objective: result.data.objective,
          assessment: result.data.assessment,
          plan: result.data.plan,
        });
      }
    } catch (error) {
      console.error('Failed to generate SOAP:', error);
    }
  };

  const isReady = voiceNote.status === VoiceNoteStatus.TRANSCRIBED;
  const hasTranscription = !!voiceNote.transcription;

  if (!hasTranscription) {
    return (
      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>This voice note must be transcribed before generating SOAP notes.</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Generate SOAP Notes from Voice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">AI Provider</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="provider"
                value="openai"
                checked={provider === 'openai'}
                onChange={() => setProvider('openai')}
                className="accent-blue-600"
              />
              <span className="text-sm">OpenAI GPT-4 (Recommended)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="provider"
                value="claude"
                checked={provider === 'claude'}
                onChange={() => setProvider('claude')}
                className="accent-blue-600"
              />
              <span className="text-sm">Anthropic Claude</span>
            </label>
          </div>
        </div>

        {/* Transcription Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Transcription</label>
          <div className="p-3 bg-gray-50 rounded-md max-h-40 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{voiceNote.transcription}</p>
          </div>
          <p className="text-xs text-gray-500">
            {voiceNote.transcription?.split(' ').length || 0} words
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!isReady || generateMutation.isPending}
          className="w-full"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating SOAP Notes...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate SOAP Notes
            </>
          )}
        </Button>

        {/* Error Display */}
        {generateMutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              {generateMutation.error instanceof Error
                ? generateMutation.error.message
                : 'Failed to generate SOAP notes. Please try again.'}
            </span>
          </div>
        )}

        {/* Success with Cost */}
        {generateMutation.isSuccess && generateMutation.data?.data && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <span>SOAP notes generated successfully!</span>
              {generateMutation.data.data.usage && (
                <div className="flex items-center gap-1 mt-1 text-sm">
                  <DollarSign className="h-3 w-3" />
                  <span>Cost: ${generateMutation.data.data.usage.cost.toFixed(3)}</span>
                  <span className="text-gray-500 ml-2">({generateMutation.data.data.usage.tokens} tokens)</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> The AI will convert your conversational voice notes into professional SOAP format. Review and edit the generated sections as needed before saving.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
