'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CanvasItem } from '@/types/canvas';

interface ShapeItemProps {
  item: CanvasItem;
  zoom: number;
  isSelected: boolean;
  theme?: 'dark' | 'light';
  isPenActive?: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  onRemove: (id: string) => void;
}

type ResizeCorner = 'nw' | 'ne' | 'se' | 'sw';

export default function ShapeItem({
  item,
  zoom,
  isSelected,
  theme = 'dark',
  isPenActive = false,
  onSelect,
  onUpdate,
  onRemove,
}: ShapeItemProps) {
  const isLight = theme === 'light';
  const shapeKind = item.shapeKind || 'rectangle';
  const strokeColor = item.strokeColor || (isLight ? '#2563eb' : '#3b82f6');
  const sw = item.strokeWidth || 3;

  // Subtle semi-transparent fill for closed shapes; none for lines and arrows
  const fillColor =
    item.fillColor ||
    (shapeKind === 'rectangle' || shapeKind === 'circle'
      ? isLight
        ? 'rgba(37, 99, 235, 0.08)'
        : 'rgba(59, 130, 246, 0.15)'
      : 'none');

  const width = Math.max(item.width, 20);
  const height = Math.max(item.height, 20);
  const markerId = `arrowhead-${item.id}`;

  const [isDragging, setIsDragging] = useState(false);
  const [resizingCorner, setResizingCorner] = useState<ResizeCorner | null>(null);

  const dragStartRef = useRef<{ startX: number; startY: number; mouseX: number; mouseY: number }>({
    startX: 0,
    startY: 0,
    mouseX: 0,
    mouseY: 0,
  });

  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    mouseX: number;
    mouseY: number;
  }>({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    mouseX: 0,
    mouseY: 0,
  });

  // Handle Dragging
  const handleDragStart = (e: React.MouseEvent) => {
    if (isPenActive || resizingCorner) return;
    if (e.button !== 0) return; // only left click
    e.stopPropagation();
    onSelect(item.id);

    setIsDragging(true);
    dragStartRef.current = {
      startX: item.x,
      startY: item.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  };

  // Handle Resizing
  const handleResizeStart = (e: React.MouseEvent, corner: ResizeCorner) => {
    if (isPenActive) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(item.id);

    setResizingCorner(corner);
    resizeStartRef.current = {
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  };

  useEffect(() => {
    if (!isDragging && !resizingCorner) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (isDragging) {
        const deltaX = (e.clientX - dragStartRef.current.mouseX) / zoom;
        const deltaY = (e.clientY - dragStartRef.current.mouseY) / zoom;
        onUpdate(item.id, {
          x: Math.round(dragStartRef.current.startX + deltaX),
          y: Math.round(dragStartRef.current.startY + deltaY),
        });
      } else if (resizingCorner) {
        const deltaX = (e.clientX - resizeStartRef.current.mouseX) / zoom;
        const deltaY = (e.clientY - resizeStartRef.current.mouseY) / zoom;
        const minSize = 20;
        const { startX, startY, startW, startH } = resizeStartRef.current;

        if (resizingCorner === 'se') {
          const newW = Math.max(minSize, Math.round(startW + deltaX));
          const newH = Math.max(minSize, Math.round(startH + deltaY));
          onUpdate(item.id, { width: newW, height: newH });
        } else if (resizingCorner === 'sw') {
          const newW = Math.max(minSize, Math.round(startW - deltaX));
          const newH = Math.max(minSize, Math.round(startH + deltaY));
          const newX = Math.round(startX + (startW - newW));
          onUpdate(item.id, { x: newX, width: newW, height: newH });
        } else if (resizingCorner === 'ne') {
          const newW = Math.max(minSize, Math.round(startW + deltaX));
          const newH = Math.max(minSize, Math.round(startH - deltaY));
          const newY = Math.round(startY + (startH - newH));
          onUpdate(item.id, { y: newY, width: newW, height: newH });
        } else if (resizingCorner === 'nw') {
          const newW = Math.max(minSize, Math.round(startW - deltaX));
          const newH = Math.max(minSize, Math.round(startH - deltaY));
          const newX = Math.round(startX + (startW - newW));
          const newY = Math.round(startY + (startH - newH));
          onUpdate(item.id, { x: newX, y: newY, width: newW, height: newH });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setResizingCorner(null);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizingCorner, item.id, onUpdate, zoom]);

  return (
    <div
      onMouseDown={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
      style={{
        position: 'absolute',
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: isSelected ? 999 : item.zIndex,
      }}
      className={`group absolute select-none ${
        isPenActive ? 'pointer-events-none' : 'pointer-events-auto'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* SVG Shape directly on the canvas without any enclosing card/box */}
      <svg
        className="w-full h-full overflow-visible pointer-events-none block"
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Invisible interactive area for effortless selection and dragging */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          className="pointer-events-auto"
        />

        {shapeKind === 'arrow' && (
          <defs>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z" fill={strokeColor} />
            </marker>
          </defs>
        )}

        {shapeKind === 'rectangle' && (
          <rect
            x={sw / 2}
            y={sw / 2}
            width={Math.max(width - sw, 1)}
            height={Math.max(height - sw, 1)}
            rx={Math.min(8, width / 4, height / 4)}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={sw}
          />
        )}

        {shapeKind === 'circle' && (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={Math.max((width - sw) / 2, 1)}
            ry={Math.max((height - sw) / 2, 1)}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={sw}
          />
        )}

        {shapeKind === 'line' && (
          <line
            x1={sw + 2}
            y1={height <= 40 ? height / 2 : height - sw - 2}
            x2={Math.max(width - sw - 2, sw + 2)}
            y2={height <= 40 ? height / 2 : sw + 2}
            stroke={strokeColor}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        )}

        {shapeKind === 'arrow' && (
          <line
            x1={sw + 2}
            y1={height <= 40 ? height / 2 : height - sw - 2}
            x2={Math.max(width - sw - 10, sw + 2)}
            y2={height <= 40 ? height / 2 : sw + 2}
            stroke={strokeColor}
            strokeWidth={sw}
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
          />
        )}
      </svg>

      {/* Selected State: Clean vector bounding outline & 4 corner resize handles */}
      {isSelected && (
        <>
          {/* Subtle selection border */}
          <div className="absolute inset-0 pointer-events-none border border-blue-500 rounded-sm" />

          {/* Floating Action Pill above the shape */}
          <div
            className={`absolute -top-7 right-0 flex items-center gap-1.5 px-2 py-0.5 rounded shadow-lg text-[10px] font-medium backdrop-blur-md transition-all z-20 pointer-events-auto ${
              isLight
                ? 'bg-white/95 border border-[#d8cfcf] text-[#2d2424] shadow-black/10'
                : 'bg-[#231b1b]/95 border border-[#524141] text-white shadow-black/80'
            }`}
          >
            <span className="capitalize opacity-75">{shapeKind}</span>
            <button
              type="button"
              aria-label="Delete shape"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-0.5 rounded cursor-pointer transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 4 Corner Resize Handles */}
          {/* Top-Left */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-[2px] shadow-sm cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
          />
          {/* Top-Right */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-[2px] shadow-sm cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
          />
          {/* Bottom-Right */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-[2px] shadow-sm cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform"
          />
          {/* Bottom-Left */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-[2px] shadow-sm cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform"
          />
        </>
      )}
    </div>
  );
}
