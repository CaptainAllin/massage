'use client';

import { Modal } from '@massage/ui';
import { VideoInterface } from './VideoInterface';
import { useJoinVideoSession } from '../../lib/hooks/use-video-sessions';
import { useEffect, useState } from 'react';

interface VideoSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export function VideoSessionModal({
  isOpen,
  onClose,
  sessionId,
}: VideoSessionModalProps) {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const joinMutation = useJoinVideoSession();

  useEffect(() => {
    if (isOpen && sessionId) {
      joinMutation.mutate(sessionId, {
        onSuccess: (data) => {
          setRoomUrl(data.url);
        },
      });
    }
  }, [isOpen, sessionId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Video Consultation">
      {joinMutation.isPending && (
        <div className="flex items-center justify-center h-64">
          <p>Joining session...</p>
        </div>
      )}

      {joinMutation.isError && (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">Failed to join session</p>
        </div>
      )}

      {roomUrl && (
        <VideoInterface roomUrl={roomUrl} onLeave={onClose} />
      )}
    </Modal>
  );
}
