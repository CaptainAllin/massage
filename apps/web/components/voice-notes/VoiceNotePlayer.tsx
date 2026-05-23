'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@massage/ui';

interface VoiceNotePlayerProps {
  audioUrl: string;
  className?: string;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handlePlaybackRateChange = () => {
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className={`flex flex-col gap-3 p-4 bg-gray-50 rounded-lg ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        <Button
          onClick={togglePlayPause}
          variant="outline"
          className="rounded-full w-10 h-10 p-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <Button
          onClick={handleRestart}
          variant="ghost"
          className="rounded-full w-8 h-8 p-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-mono text-gray-600 min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            value={currentTime}
            onChange={handleSeek}
            max={duration || 100}
            step={0.1}
            className="flex-1 h-1 accent-blue-600"
          />
          <span className="text-xs font-mono text-gray-600 min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        <Button
          onClick={handlePlaybackRateChange}
          variant="ghost"
          className="text-xs font-medium min-w-[45px]"
        >
          {playbackRate}x
        </Button>

        <div className="flex items-center gap-2 w-24">
          <Volume2 className="h-4 w-4 text-gray-500" />
          <input
            type="range"
            value={volume}
            onChange={handleVolumeChange}
            max={1}
            step={0.01}
            className="flex-1 h-1 accent-blue-600"
          />
        </div>
      </div>

      <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};
