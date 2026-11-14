'use client';

import React from 'react';
import { ActiveTool, DrawingPoint, DrawingStroke } from '@/types/canvas';

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  currentStroke?: DrawingStroke | null;
  zoom: number;
  pan: { x: number; y: number };
  activeTool?: ActiveTool;
  selectedStrokeIds?: string[];
  onStrokePointerDown?: (strokeId: string, e: React.PointerEvent) => void;
}

// Convert points array to a smooth SVG path using midpoint quadratic bezier curves
export function pointsToSvgPath(points: DrawingPoint[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    // Single dot
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    d += ` Q ${p1.x} ${p1.y}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function getStrokeBounds(points: DrawingPoint[], strokeWidth = 4) {
  if (!points || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  const half = (strokeWidth || 4) / 2;
  return {
    minX: minX - half,
    minY: minY - half,
    maxX: maxX + half,
    maxY: maxY + half,
    width: maxX - minX + (strokeWidth || 4),
    height: maxY - minY + (strokeWidth || 4),
  };
}

export default function DrawingCanvas({
  strokes,
  currentStroke,
  zoom,
  pan,
  activeTool = 'select',
  selectedStrokeIds = [],
  onStrokePointerDown,
}: DrawingCanvasProps) {
  const isSelectable = activeTool === 'select';

  return (
    <svg
      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-20"
      style={{
        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      {/* 1. All saved strokes on the canvas */}
      {strokes.map((stroke) => {
        const isSelected = selectedStrokeIds.includes(stroke.id);
        const pathData = pointsToSvgPath(stroke.points);
        const bounds = isSelected ? getStrokeBounds(stroke.points, stroke.width) : null;

        return (
          <g
            key={stroke.id}
            className={isSelectable ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
            onPointerDown={(e) => {
              if (isSelectable) {
                e.stopPropagation();
                onStrokePointerDown?.(stroke.id, e);
              }
            }}
          >
            {/* Selection Bounding Box & Highlight Halo */}
            {isSelected && bounds && (
              <>
                {/* Blue halo under selected stroke */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={stroke.width + 6}
                  strokeOpacity={0.35}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none"
                />

                {/* Bounding box outline */}
                <rect
                  x={bounds.minX - 6}
                  y={bounds.minY - 6}
                  width={bounds.width + 12}
                  height={bounds.height + 12}
                  fill="rgba(59, 130, 246, 0.05)"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  rx={4}
                  className="pointer-events-none"
                />

                {/* Grabbable inner area when selected */}
                <rect
                  x={bounds.minX - 6}
                  y={bounds.minY - 6}
                  width={bounds.width + 12}
                  height={bounds.height + 12}
                  fill="transparent"
                  className="pointer-events-auto cursor-grab active:cursor-grabbing"
                />

                {/* 4 Corner anchor handles */}
                <rect
                  x={bounds.minX - 9}
                  y={bounds.minY - 9}
                  width={6}
                  height={6}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  rx={1}
                  className="pointer-events-none"
                />
                <rect
                  x={bounds.maxX + 3}
                  y={bounds.minY - 9}
                  width={6}
                  height={6}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  rx={1}
                  className="pointer-events-none"
                />
                <rect
                  x={bounds.minX - 9}
                  y={bounds.maxY + 3}
                  width={6}
                  height={6}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  rx={1}
                  className="pointer-events-none"
                />
                <rect
                  x={bounds.maxX + 3}
                  y={bounds.maxY + 3}
                  width={6}
                  height={6}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  rx={1}
                  className="pointer-events-none"
                />
              </>
            )}

            {/* Invisible Hit-Test Path for easy clicking in Select mode */}
            {isSelectable && (
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(stroke.width + 16, 20)}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-auto cursor-grab active:cursor-grabbing"
              />
            )}

            {/* Visible Stroke */}
            <path
              d={pathData}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
          </g>
        );
      })}

      {/* 2. Active stroke currently being drawn by user */}
      {currentStroke && currentStroke.points && currentStroke.points.length > 0 && (
        <path
          d={pointsToSvgPath(currentStroke.points)}
          fill="none"
          stroke={currentStroke.color}
          strokeWidth={currentStroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
      )}
    </svg>
  );
}
