'use client';

import { useEffect, useRef } from 'react';

interface VideoInterfaceProps {
  roomUrl: string;
  onLeave: () => void;
}

export function VideoInterface({ roomUrl, onLeave }: VideoInterfaceProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for Daily events via postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === 'daily-left-meeting') {
        onLeave();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLeave]);

  return (
    <div className="w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        src={roomUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        className="w-full h-full border-0"
      />
    </div>
  );
}
