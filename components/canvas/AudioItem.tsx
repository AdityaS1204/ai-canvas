'use client';

import React, { useRef, useState } from 'react';
import { CanvasItem } from '@/types/canvas';
import CanvasItemCard from './CanvasItemCard';

interface AudioItemProps {
  item: CanvasItem;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  onRemove: (id: string) => void;
}

export default function AudioItem({
  item,
  zoom,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: AudioItemProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <CanvasItemCard
      item={item}
      zoom={zoom}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onRemove={onRemove}
    >
      <div className="w-full h-full flex flex-col justify-between p-3 bg-black rounded-xl border border-white/10">
        <audio
          ref={audioRef}
          src={item.url}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Audio Title / Source */}
        <div className="flex items-center justify-between text-xs text-white">
          <span className="font-medium truncate max-w-[180px]">{item.title || 'Audio Track'}</span>
          <span className="text-[10px] text-blue-400 font-medium">Cloudinary</span>
        </div>

        {/* Visualizer animation waves (pure blue, white, black) */}
        <div className="flex items-center justify-center gap-1.5 h-12 my-auto px-4">
          {[40, 70, 30, 90, 50, 100, 60, 85, 45, 95, 35, 80, 55, 75, 40].map((height, i) => (
            <div
              key={i}
              style={{
                height: isPlaying ? `${height}%` : '20%',
                transition: 'height 0.2s ease',
              }}
              className={`w-1 rounded-full ${
                isPlaying ? 'bg-blue-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Audio controls */}
        <div className="flex flex-col gap-2">
          {/* Progress bar */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          <div className="flex items-center justify-between text-xs text-white">
            <button
              type="button"
              onClick={togglePlay}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play</span>
                </>
              )}
            </button>

            <span className="font-mono text-[11px] text-white/60">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </CanvasItemCard>
  );
}
