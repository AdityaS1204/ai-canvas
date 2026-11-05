'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CanvasItem } from '@/types/canvas';
import { Close } from '@honeyicons/react';

interface CanvasItemCardProps {
  item: CanvasItem;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

export default function CanvasItemCard({
  item,
  zoom,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  children,
}: CanvasItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
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

    onSelect(item.id);
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
        onUpdate(item.id, {
          x: Math.round(dragStartRef.current.startX + deltaX),
          y: Math.round(dragStartRef.current.startY + deltaY),
        });
      } else if (isResizing) {
        const deltaX = (e.clientX - resizeStartRef.current.mouseX) / zoom;
        const deltaY = (e.clientY - resizeStartRef.current.mouseY) / zoom;
        const newWidth = Math.max(200, Math.round(resizeStartRef.current.startW + deltaX));
        const newHeight = Math.max(120, Math.round(resizeStartRef.current.startH + deltaY));
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
  }, [isDragging, isResizing, item.id, onUpdate, zoom]);

  return (
    <div
      ref={cardRef}
      onMouseDown={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
      style={{
        position: 'absolute',
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        zIndex: isSelected ? 999 : item.zIndex,
      }}
      /* pointer-events-auto ensures full interaction even inside pointer-events-none parent layer */
      className={`group absolute pointer-events-auto select-none rounded-2xl flex flex-col p-1.5 pt-1 transition-shadow duration-150 ${
        isDragging ? 'cursor-grabbing ring-2 ring-neutral-400 shadow-2xl shadow-black/80 opacity-95' : 'cursor-grab'
      } ${
        isSelected
          ? 'ring-2 ring-neutral-300 shadow-2xl shadow-black/80'
          : 'ring-1 ring-white/10 hover:ring-white/25 shadow-xl shadow-black/80'
      } bg-[#282626]`}
    >
      {/* Top Header Bar matching reference image with close icon on top right */}
      <div
        className="w-full h-7 flex items-center justify-between px-1.5 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Subtle drag grip handle */}
        <div className="flex items-center gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>

        {/* HoneyIcons Close icon on top-right */}
        <button
          type="button"
          title="Remove box"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="text-white/80 hover:text-white transition-opacity p-0.5 cursor-pointer pointer-events-auto"
        >
          <Close size={15} />
        </button>
      </div>

      {/* Inner Content Area */}
      <div className="relative flex-1 w-full rounded-xl overflow-hidden flex flex-col pointer-events-auto">
        {children}
      </div>

      {/* Resize Handle (Bottom-Right Corner) */}
      <div
        onMouseDown={handleResizeStart}
        title="Drag to resize"
        className="resize-handle absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity pointer-events-auto"
      >
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none" className="text-white pointer-events-none">
          <circle cx="6" cy="6" r="0.8" fill="currentColor" />
          <circle cx="3.5" cy="6" r="0.8" fill="currentColor" />
          <circle cx="6" cy="3.5" r="0.8" fill="currentColor" />
          <circle cx="1" cy="6" r="0.8" fill="currentColor" />
          <circle cx="3.5" cy="3.5" r="0.8" fill="currentColor" />
          <circle cx="6" cy="1" r="0.8" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
