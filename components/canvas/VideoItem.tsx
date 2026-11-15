'use client';

import React, { useRef, useState } from 'react';
import { CanvasItem, AnchorSide } from '@/types/canvas';
import CanvasItemCard from './CanvasItemCard';
import { parseVideoUrl } from '@/lib/video-parser';

interface VideoItemProps {
  theme?: 'dark' | 'light';
  isPenActive?: boolean;
  item: CanvasItem;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, deltaX: number, deltaY: number) => void;
  onRemove: (id: string) => void;
  onStartConnect?: (itemId: string, side: AnchorSide, e: React.MouseEvent) => void;
  isConnecting?: boolean;
  snappedSide?: AnchorSide | null;
}

export default function VideoItem({
  theme = 'dark',
  isPenActive = false,
  item,
  zoom,
  isSelected,
  onSelect,
  onUpdate,
  onDragStart,
  onDragMove,
  onRemove,
  onStartConnect,
  isConnecting,
  snappedSide,
}: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  const parsed = parseVideoUrl(item.url || '');

  return (
    <CanvasItemCard
      theme={theme}
      isPenActive={isPenActive}
      item={item}
      zoom={zoom}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onRemove={onRemove}
      onStartConnect={onStartConnect}
      isConnecting={isConnecting}
      snappedSide={snappedSide}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-[14px] overflow-hidden">
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-4 text-center text-white/80 text-xs">
            <p className="font-semibold text-white">Failed to load video</p>
            <span className="text-[10px] text-white/40 mt-1 break-all line-clamp-2">{item.url}</span>
          </div>
        ) : parsed.kind === 'iframe' ? (
          /* Embedded Video Player: YouTube / Pinterest / Vimeo */
          <iframe
            src={parsed.embedUrl}
            title={item.title || parsed.titleFallback}
            className="w-full h-full border-0 rounded-[14px] bg-black pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          /* Direct HTML5 Video Player: Cloudinary / MP4 / WebM */
          <video
            ref={videoRef}
            src={item.url}
            controls
            playsInline
            preload="metadata"
            onError={() => setHasError(true)}
            className="w-full h-full object-contain rounded-[14px] bg-black pointer-events-auto"
          />
        )}
      </div>
    </CanvasItemCard>
  );
}
