'use client';

import React, { useRef, useState } from 'react';
import { CanvasItem } from '@/types/canvas';
import CanvasItemCard from './CanvasItemCard';
import { parseVideoUrl } from '@/lib/video-parser';

interface VideoItemProps {
  theme?: 'dark' | 'light';
  item: CanvasItem;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  onRemove: (id: string) => void;
}

export default function VideoItem({
  theme = 'dark',
  item,
  zoom,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  const parsed = parseVideoUrl(item.url || '');

  return (
    <CanvasItemCard
      theme={theme}
      item={item}
      zoom={zoom}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onRemove={onRemove}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden group/vid">
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
            className="w-full h-full border-0 rounded-xl bg-black pointer-events-auto"
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
            className="w-full h-full object-contain rounded-xl bg-black pointer-events-auto"
          />
        )}

        {/* Video platform badge overlay on hover */}
        <div className="absolute top-2 left-2 pointer-events-none opacity-0 group-hover/vid:opacity-100 transition-opacity bg-black/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white border border-white/20 capitalize flex items-center gap-1.5">
          <span className="text-blue-400 font-medium">{parsed.platform}</span>
          {item.storageMeta?.duration && (
            <span>• {Math.round(item.storageMeta.duration)}s</span>
          )}
        </div>
      </div>
    </CanvasItemCard>
  );
}
