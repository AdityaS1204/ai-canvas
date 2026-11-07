'use client';

import React, { useState } from 'react';
import { CanvasItem, AnchorSide } from '@/types/canvas';
import CanvasItemCard from './CanvasItemCard';

interface ImageItemProps {
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

export default function ImageItem({
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
}: ImageItemProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
      <div className="relative w-full h-full flex items-center justify-center bg-black rounded-xl overflow-hidden group/img">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 animate-pulse">
            <span className="text-xs text-white/50">Loading image...</span>
          </div>
        )}

        {hasError ? (
          <div className="p-4 text-center text-white/80 text-xs">
            <p className="font-semibold text-white">Failed to load image</p>
            <span className="text-[10px] text-white/40 mt-1 break-all line-clamp-2">{item.url}</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.url}
            alt={item.title || 'Canvas Image'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            draggable={false}
            className="w-full h-full object-cover rounded-xl pointer-events-none select-none"
          />
        )}

        {/* Subtle metadata overlay on hover (only blue, white, black) */}
        {item.storageMeta && (
          <div className="absolute top-2 left-2 pointer-events-none opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white border border-white/20">
            <span className="text-blue-400 font-medium">Cloudinary</span>
            {item.storageMeta.width && item.storageMeta.height ? ` • ${item.storageMeta.width}×${item.storageMeta.height}` : ''}
          </div>
        )}
      </div>
    </CanvasItemCard>
  );
}
