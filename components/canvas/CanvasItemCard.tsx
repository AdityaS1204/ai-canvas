'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CanvasItem, AnchorSide } from '@/types/canvas';
import { Close } from '@honeyicons/react';
import AnchorPoints from './AnchorPoints';

interface CanvasItemCardProps {
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
  children: React.ReactNode;
}

export default function CanvasItemCard({
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
  children,
}: CanvasItemCardProps) {
  const isLight = theme === 'light';
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Keep latest item position in ref to prevent stale closures
  const currentPosRef = useRef({ x: item.x, y: item.y, width: item.width, height: item.height });
  currentPosRef.current = { x: item.x, y: item.y, width: item.width, height: item.height };

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: item.x,
    startY: item.y,
  });

  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; startW: number; startH: number }>({
    mouseX: 0,
    mouseY: 0,
    startW: item.width,
    startH: item.height,
  });

  // Start dragging item from top bar or outer frame
  const handleDragStart = (e: React.MouseEvent) => {
    // Only primary mouse button
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons, resize handle, or active text inputs
    if (
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.tagName === 'TEXTAREA' ||
      target.closest('textarea') ||
      target.classList.contains('resize-handle') ||
      target.closest('.resize-handle') ||
      target.tagName === 'INPUT' ||
      target.tagName === 'VIDEO' ||
      target.tagName === 'AUDIO'
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    onSelect(item.id, e);
    onDragStart?.(item.id);
    setIsDragging(true);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentPosRef.current.x,
      startY: currentPosRef.current.y,
    };
  };

  // Start resizing item
  const handleResizeStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: currentPosRef.current.width,
      startH: currentPosRef.current.height,
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (isDragging) {
        const deltaX = (e.clientX - dragStartRef.current.mouseX) / zoom;
        const deltaY = (e.clientY - dragStartRef.current.mouseY) / zoom;
        if (onDragMove) {
          onDragMove(item.id, deltaX, deltaY);
        } else {
          onUpdate(item.id, {
            x: Math.round(dragStartRef.current.startX + deltaX),
            y: Math.round(dragStartRef.current.startY + deltaY),
          });
        }
      } else if (isResizing) {
        const deltaX = (e.clientX - resizeStartRef.current.mouseX) / zoom;
        const deltaY = (e.clientY - resizeStartRef.current.mouseY) / zoom;
        const minW = item.type === 'shape' ? 40 : 200;
        const minH = item.type === 'shape' ? 40 : 120;
        const newWidth = Math.max(minW, Math.round(resizeStartRef.current.startW + deltaX));
        const newHeight = Math.max(minH, Math.round(resizeStartRef.current.startH + deltaY));
        onUpdate(item.id, {
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, item.id, onUpdate, onDragMove, zoom]);

  const isMedia = item.type === 'image' || item.type === 'video';

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id, e);
      }}
      style={{
        position: 'absolute',
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        zIndex: isSelected ? 999 : item.zIndex,
      }}
      /* pointer-events-auto ensures full interaction; disabled during pen drawing to allow uninterrupted sketching */
      className={`group absolute ${
        isPenActive ? 'pointer-events-none' : 'pointer-events-auto'
      } select-none flex flex-col transition-all duration-150 ${
        isMedia
          ? `rounded-[22px] p-2 border-[3.5px] ${
              isSelected
                ? 'border-blue-500 shadow-2xl shadow-blue-500/25 ring-2 ring-blue-500/30'
                : isDragging
                ? 'border-blue-400 opacity-95 shadow-2xl shadow-black/80'
                : isLight
                ? 'border-[#ded7d7] hover:border-[#c5bebe] bg-[#f5f0f0] shadow-md shadow-black/5'
                : 'border-[#2d2727] hover:border-[#3d3535] bg-[#181313] shadow-xl shadow-black/80'
            } cursor-grab active:cursor-grabbing`
          : `rounded-2xl p-1.5 pt-1 ${
              isDragging
                ? isLight
                  ? 'cursor-grabbing ring-2 ring-black/40 shadow-2xl shadow-black/15 opacity-95'
                  : 'cursor-grabbing ring-2 ring-neutral-400 shadow-2xl shadow-black/80 opacity-95'
                : 'cursor-grab'
            } ${
              isSelected
                ? isLight
                  ? 'ring-2 ring-blue-500 shadow-2xl shadow-black/15'
                  : 'ring-2 ring-neutral-300 shadow-2xl shadow-black/80'
                : isLight
                ? 'ring-1 ring-black/10 hover:ring-black/25 shadow-lg shadow-black/5'
                : 'ring-1 ring-white/10 hover:ring-white/25 shadow-xl shadow-black/80'
            } ${isLight ? 'bg-[#ffffff]' : 'bg-[#282626]'}`
      }`}
    >
      {/* For Media: Pure frameless presentation with NO external header. Floating info and close button only on hover! */}
      {isMedia ? (
        <>
          {/* Inner Content Area */}
          <div className="relative flex-1 w-full h-full rounded-[14px] overflow-hidden flex flex-col pointer-events-auto">
            {children}
          </div>

          {/* Floating Hover Overlay: Title, source, metadata on left, Close button on right */}
          <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
            <div className="flex items-start justify-between w-full gap-2">
              <div className="flex flex-col gap-1 max-w-[75%]">
                {item.title && (
                  <div className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-medium text-white truncate shadow-lg">
                    {item.title}
                  </div>
                )}
                <div className="flex items-center gap-1.5 self-start px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[10px] text-white/80">
                  <span className="text-blue-400 font-medium capitalize">
                    {item.storageMeta?.provider || (item.type === 'video' ? 'Video' : 'Image')}
                  </span>
                  {item.storageMeta?.width && item.storageMeta?.height && (
                    <span className="text-white/50">
                      • {item.storageMeta.width}×{item.storageMeta.height}
                    </span>
                  )}
                  {item.storageMeta?.duration && (
                    <span className="text-white/50">
                      • {Math.round(item.storageMeta.duration)}s
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="w-7 h-7 rounded-full bg-black/80 hover:bg-black text-white/90 hover:text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 shadow-lg cursor-pointer pointer-events-auto"
              >
                <Close size={13} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Top Header Bar for text/shape/audio cards */}
          <div className="w-full h-7 flex items-center justify-between px-1.5 cursor-grab active:cursor-grabbing select-none">
            {/* Subtle drag grip handle */}
            <div className="flex items-center gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
              <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-black' : 'bg-white'}`} />
            </div>

            {/* HoneyIcons Close icon on top-right */}
            <button
              type="button"
              title="Remove box"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className={`transition-opacity p-0.5 cursor-pointer pointer-events-auto ${
                isLight ? 'text-black/60 hover:text-black' : 'text-white/80 hover:text-white'
              }`}
            >
              <Close size={15} />
            </button>
          </div>

          {/* Inner Content Area */}
          <div className="relative flex-1 w-full rounded-xl overflow-hidden flex flex-col pointer-events-auto">
            {children}
          </div>
        </>
      )}

      {/* Resize Handle (Bottom-Right Corner) */}
      <div
        onMouseDown={handleResizeStart}
        title="Drag to resize"
        className={`resize-handle absolute bottom-2 right-2 w-4 h-4 cursor-nwse-resize flex items-center justify-center transition-opacity pointer-events-auto z-40 ${
          isMedia ? 'opacity-0 group-hover:opacity-60 hover:!opacity-100' : 'opacity-30 hover:opacity-100'
        }`}
      >
        <svg
          width="7"
          height="7"
          viewBox="0 0 7 7"
          fill="none"
          className={`${isLight ? 'text-black' : 'text-white'} pointer-events-none`}
        >
          <circle cx="6" cy="6" r="0.8" fill="currentColor" />
          <circle cx="3.5" cy="6" r="0.8" fill="currentColor" />
          <circle cx="6" cy="3.5" r="0.8" fill="currentColor" />
          <circle cx="1" cy="6" r="0.8" fill="currentColor" />
          <circle cx="3.5" cy="3.5" r="0.8" fill="currentColor" />
          <circle cx="6" cy="1" r="0.8" fill="currentColor" />
        </svg>
      </div>
      {/* Magnetic Anchor Points */}
      {onStartConnect && (
        <AnchorPoints
          itemId={item.id}
          width={item.width}
          height={item.height}
          isVisible={!isPenActive && (isHovered || isSelected || Boolean(isConnecting))}
          highlightedSide={snappedSide}
          onStartConnect={onStartConnect}
        />
      )}
    </div>
  );
}
