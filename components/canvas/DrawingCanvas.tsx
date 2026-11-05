'use client';

import React, { useRef, useState } from 'react';
import { DrawingPoint, DrawingStroke } from '@/types/canvas';

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  onAddStroke: (stroke: DrawingStroke) => void;
  isPenActive: boolean;
  penColor: string;
  penWidth: number;
  zoom: number;
  pan: { x: number; y: number };
}

export default function DrawingCanvas({
  strokes,
  onAddStroke,
  isPenActive,
  penColor,
  penWidth,
  zoom,
  pan,
}: DrawingCanvasProps) {
  const [currentPoints, setCurrentPoints] = useState<DrawingPoint[]>([]);
  const isDrawing = useRef(false);

  // Convert screen coordinates to world canvas coordinates
  const screenToWorld = (clientX: number, clientY: number): DrawingPoint => {
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPenActive || e.button !== 0) return;
    isDrawing.current = true;
    const pt = screenToWorld(e.clientX, e.clientY);
    setCurrentPoints([pt]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current || !isPenActive) return;
    const pt = screenToWorld(e.clientX, e.clientY);
    setCurrentPoints((prev) => [...prev, pt]);
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentPoints.length > 1) {
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        points: currentPoints,
        color: penColor,
        width: penWidth,
      };
      onAddStroke(newStroke);
    }
    setCurrentPoints([]);
  };

  // Convert points array to SVG path 'd' attribute
  const pointsToSvgPath = (points: DrawingPoint[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      d += ` L ${p.x} ${p.y}`;
    }
    return d;
  };

  return (
    <svg
      className={`absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10`}
      style={{
        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      {/* Existing strokes */}
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

      {/* Stroke currently being drawn */}
      {currentPoints.length > 0 && (
        <path
          d={pointsToSvgPath(currentPoints)}
          fill="none"
          stroke={penColor}
          strokeWidth={penWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

