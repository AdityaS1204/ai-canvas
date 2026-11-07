'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CanvasItem, AnchorSide } from '@/types/canvas';
import AnchorPoints from './AnchorPoints';

interface ShapeItemProps {
  item: CanvasItem;
  zoom: number;
  isSelected: boolean;
  theme?: 'dark' | 'light';
  isPenActive?: boolean;
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, deltaX: number, deltaY: number) => void;
  onRemove: (id: string) => void;
  onStartConnect?: (itemId: string, side: AnchorSide, e: React.MouseEvent) => void;
  isConnecting?: boolean;
  snappedSide?: AnchorSide | null;
}

type ResizeCorner = 'nw' | 'ne' | 'se' | 'sw';
type RotateAxis = 'z' | 'x' | 'y';

export default function ShapeItem({
  item,
  zoom,
  isSelected,
  theme = 'dark',
  isPenActive = false,
  onSelect,
  onUpdate,
  onDragStart,
  onDragMove,
  onRemove,
  onStartConnect,
  isConnecting,
  snappedSide,
}: ShapeItemProps) {
  const isLight = theme === 'light';
  const shapeKind = item.shapeKind || 'rectangle';
  const strokeColor = item.strokeColor || (isLight ? '#2563eb' : '#3b82f6');
  const sw = item.strokeWidth || 3;

  // Transparent background for all shapes as requested
  const fillColor = 'transparent';

  const width = Math.max(item.width, 20);
  const height = Math.max(item.height, 20);
  const markerId = `arrowhead-${item.id}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizingCorner, setResizingCorner] = useState<ResizeCorner | null>(null);
  const [rotatingAxis, setRotatingAxis] = useState<RotateAxis | null>(null);

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

  const rotateStartRef = useRef<{
    startX: number;
    startY: number;
    startRotation: number;
    startRotateX: number;
    startRotateY: number;
    centerX: number;
    centerY: number;
  }>({
    startX: 0,
    startY: 0,
    startRotation: 0,
    startRotateX: 0,
    startRotateY: 0,
    centerX: 0,
    centerY: 0,
  });

  // Handle Dragging
  const handleDragStart = (e: React.MouseEvent) => {
    if (isPenActive || resizingCorner || rotatingAxis) return;
    if (e.button !== 0) return; // only left click
    e.stopPropagation();
    onSelect(item.id, e);
    onDragStart?.(item.id);

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

  // Handle Rotation (Z, X, or Y axis)
  const handleRotateStart = (e: React.MouseEvent, axis: RotateAxis) => {
    if (isPenActive) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(item.id);

    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : e.clientX;
    const centerY = rect ? rect.top + rect.height / 2 : e.clientY;

    setRotatingAxis(axis);
    rotateStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRotation: item.rotation || 0,
      startRotateX: item.rotateX || 0,
      startRotateY: item.rotateY || 0,
      centerX,
      centerY,
    };
  };

  useEffect(() => {
    if (!isDragging && !resizingCorner && !rotatingAxis) return;

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
      } else if (rotatingAxis === 'z') {
        // 2D Rotation (Z-axis)
        const { centerX, centerY } = rotateStartRef.current;
        const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let deg = Math.round(rad * (180 / Math.PI) + 90);
        if (deg < 0) deg += 360;
        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
        }
        onUpdate(item.id, { rotation: deg % 360 });
      } else if (rotatingAxis === 'x') {
        // Rotate around X-axis (Pitch / Vertical flip)
        const deltaY = (e.clientY - rotateStartRef.current.startY) / zoom;
        let newRotX = Math.round(rotateStartRef.current.startRotateX - deltaY * 1.5);
        if (e.shiftKey) {
          newRotX = Math.round(newRotX / 15) * 15;
        }
        onUpdate(item.id, { rotateX: newRotX });
      } else if (rotatingAxis === 'y') {
        // Rotate around Y-axis (Yaw / Horizontal flip)
        const deltaX = (e.clientX - rotateStartRef.current.startX) / zoom;
        let newRotY = Math.round(rotateStartRef.current.startRotateY + deltaX * 1.5);
        if (e.shiftKey) {
          newRotY = Math.round(newRotY / 15) * 15;
        }
        onUpdate(item.id, { rotateY: newRotY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setResizingCorner(null);
      setRotatingAxis(null);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizingCorner, rotatingAxis, item.id, onUpdate, onDragMove, zoom]);

  const rotationZ = item.rotation || 0;
  const rotateX = item.rotateX || 0;
  const rotateY = item.rotateY || 0;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id, e);
      }}
      style={{
        position: 'absolute',
        transform: `translate3d(${item.x}px, ${item.y}px, 0) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotationZ}deg)`,
        transformOrigin: 'center center',
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
        {/* Invisible interactive hit area for effortless selection and dragging */}
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
              markerWidth="16"
              markerHeight="16"
              refX="11.5"
              refY="8"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M 4 3 L 11.5 8 L 4 13"
                fill="none"
                stroke={strokeColor}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
            fill="transparent"
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
            fill="transparent"
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

      {/* Live Rotation Degree Readout when rotating via on-canvas handles */}
      {rotatingAxis && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-black/85 text-white text-xs font-mono font-semibold shadow-2xl pointer-events-none z-50 whitespace-nowrap border border-white/20 backdrop-blur-md">
          {rotatingAxis === 'z' && `${rotationZ}°`}
          {rotatingAxis === 'x' && `${rotateX}°`}
          {rotatingAxis === 'y' && `${rotateY}°`}
        </div>
      )}

      {/* Selected State: Clean vector bounding outline, 4 corner resize handles, and rotation handles */}
      {isSelected && (
        <>
          {/* Subtle selection border */}
          <div className="absolute inset-0 pointer-events-none border border-blue-500 rounded-sm" />

          {/* Floating Action Pill above the shape */}
          <div
            className={`absolute -top-8 right-0 flex items-center gap-1.5 px-2 py-0.5 rounded shadow-xl text-[10px] font-medium backdrop-blur-md transition-all z-30 pointer-events-auto ${
              isLight
                ? 'bg-white/95 border border-[#d8cfcf] text-[#2d2424] shadow-black/10'
                : 'bg-[#231b1b]/95 border border-[#524141] text-white shadow-black/80'
            }`}
          >
            {/* Reset Rotation Button */}
            {rotationZ !== 0 || rotateX !== 0 || rotateY !== 0 ? (
              <button
                type="button"
                title={`Reset rotation to 0° (Current: 2D:${rotationZ}° X:${rotateX}° Y:${rotateY}°)`}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(item.id, { rotation: 0, rotateX: 0, rotateY: 0 });
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium'
                    : 'bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 font-medium'
                }`}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Reset 0°</span>
              </button>
            ) : (
              <button
                type="button"
                title="Shape is at 0°"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(item.id, { rotation: 0, rotateX: 0, rotateY: 0 });
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors opacity-50 cursor-pointer ${
                  isLight ? 'hover:bg-black/5 text-[#5a4848]' : 'hover:bg-white/10 text-white/70'
                }`}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Reset</span>
              </button>
            )}

            {/* Delete shape button */}
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

          {/* 1. 2D Rotation Stem Line */}
          <div className="absolute left-1/2 -top-5 w-[1.5px] h-5 bg-blue-500 -translate-x-1/2 pointer-events-none" />

          {/* 2. 2D Rotation Handle (Z-axis) */}
          <div
            onMouseDown={(e) => handleRotateStart(e, 'z')}
            title="Rotate Shape (2D In-plane). Drag around center. Hold Shift to snap 15°"
            className="absolute left-1/2 -top-8 -translate-x-1/2 w-6 h-6 bg-white border-2 border-blue-600 rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-115 active:scale-95 transition-transform pointer-events-auto"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </div>

          {/* 3. Rotate X Handle (bottom-center) */}
          <div
            onMouseDown={(e) => handleRotateStart(e, 'x')}
            title="Rotate X-Axis (Pitch / 3D Vertical Tilt). Drag up/down. Hold Shift to snap 15°"
            className="absolute left-1/2 -bottom-3 -translate-x-1/2 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-mono font-bold rounded-full shadow-md flex items-center gap-1 cursor-ns-resize hover:scale-110 active:scale-95 transition-transform pointer-events-auto select-none border border-white/30"
          >
            <span>↕ Rotate X</span>
          </div>

          {/* 4. Rotate Y Handle (right-center) */}
          <div
            onMouseDown={(e) => handleRotateStart(e, 'y')}
            title="Rotate Y-Axis (Yaw / 3D Horizontal Flip). Drag left/right. Hold Shift to snap 15°"
            className="absolute -right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-mono font-bold rounded-full shadow-md flex items-center gap-1 cursor-ew-resize hover:scale-110 active:scale-95 transition-transform pointer-events-auto select-none border border-white/30"
          >
            <span>↔ Rotate Y</span>
          </div>

          {/* 5. 4 Corner Resize Handles */}
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

      {/* Magnetic Anchor Points */}
      {onStartConnect && (
        <AnchorPoints
          itemId={item.id}
          width={width}
          height={height}
          isVisible={!isPenActive && (isHovered || isSelected || Boolean(isConnecting))}
          highlightedSide={snappedSide}
          onStartConnect={onStartConnect}
        />
      )}
    </div>
  );
}
