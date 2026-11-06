'use client';

import React from 'react';
import { DrawingPoint, DrawingStroke } from '@/types/canvas';

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  currentStroke?: DrawingStroke | null;
  zoom: number;
  pan: { x: number; y: number };
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

export default function DrawingCanvas({
  strokes,
  currentStroke,
  zoom,
  pan,
}: DrawingCanvasProps) {
  return (
    <svg
      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-20"
      style={{
        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      {/* 1. All saved strokes on the canvas */}
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={pointsToSvgPath(stroke.points)}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* 2. Active stroke currently being drawn by user */}
      {currentStroke && currentStroke.points && currentStroke.points.length > 0 && (
        <path
          d={pointsToSvgPath(currentStroke.points)}
          fill="none"
          stroke={currentStroke.color}
          strokeWidth={currentStroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
