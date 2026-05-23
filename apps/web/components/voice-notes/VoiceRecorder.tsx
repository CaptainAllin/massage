'use client';

import React from 'react';
import { useVoiceRecorder, RecordingState } from './hooks/useVoiceRecorder';
import { Mic, Square, Pause, Play, RotateCcw } from 'lucide-react';
import { Button, Card, CardContent } from '@massage/ui';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 600,
}) => {
  const {
    recordingState,
    duration,
    audioBlob,
    audioUrl,
    error,
    isSupported,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
      resetRecording();
    }
  };

  const handleCancel = () => {
    resetRecording();
    onCancel?.();
  };

  React.useEffect(() => {
    if (duration >= maxDuration && recordingState === RecordingState.RECORDING) {
      stopRecording();
    }
  }, [duration, maxDuration, recordingState, stopRecording]);

  if (!isSupported) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
        Voice recording is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-gray-900">
              {formatDuration(duration)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {recordingState === RecordingState.RECORDING && (
                <span className="flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Recording...
                </span>
              )}
              {recordingState === RecordingState.PAUSED && 'Paused'}
              {recordingState === RecordingState.STOPPED && 'Recording Complete'}
              {recordingState === RecordingState.IDLE && 'Ready to Record'}
            </div>
          </div>

          {recordingState === RecordingState.RECORDING && (
            <div className="flex items-center justify-center gap-1 h-16">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            {recordingState === RecordingState.IDLE && (
              <Button
                onClick={startRecording}
                className="rounded-full w-16 h-16"
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}

            {recordingState === RecordingState.RECORDING && (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="rounded-full w-14 h-14"
                >
                  <Pause className="h-5 w-5" />
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="danger"
                  className="rounded-full w-16 h-16"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}

            {recordingState === RecordingState.PAUSED && (
              <>
                <Button
                  onClick={resumeRecording}
                  className="rounded-full w-14 h-14"
                >
                  <Play className="h-5 w-5" />
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="danger"
                  className="rounded-full w-16 h-16"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}

            {recordingState === RecordingState.STOPPED && (
              <Button
                onClick={resetRecording}
                variant="outline"
                className="rounded-full w-14 h-14"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            )}
          </div>

          {recordingState === RecordingState.STOPPED && audioUrl && (
            <div className="w-full space-y-4">
              <audio
                controls
                src={audioUrl}
                className="w-full"
                controlsList="nodownload"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  Save Recording
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {duration > maxDuration * 0.9 && recordingState === RecordingState.RECORDING && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
              Approaching maximum recording duration ({formatDuration(maxDuration)})
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
