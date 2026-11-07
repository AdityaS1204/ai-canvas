'use client';

import React from 'react';
import { AnchorSide } from '@/types/canvas';

interface AnchorPointsProps {
  itemId: string;
  width: number;
  height: number;
  isVisible: boolean;
  highlightedSide?: AnchorSide | null;
  onStartConnect?: (itemId: string, side: AnchorSide, e: React.MouseEvent) => void;
}

const SIDES: { side: AnchorSide; label: string; style: (w: number, h: number) => React.CSSProperties }[] = [
  {
    side: 'top',
    label: 'Top anchor',
    style: (w) => ({ left: `${w / 2}px`, top: '0px', transform: 'translate(-50%, -50%)' }),
  },
  {
    side: 'right',
    label: 'Right anchor',
    style: (w, h) => ({ left: `${w}px`, top: `${h / 2}px`, transform: 'translate(-50%, -50%)' }),
  },
  {
    side: 'bottom',
    label: 'Bottom anchor',
    style: (w, h) => ({ left: `${w / 2}px`, top: `${h}px`, transform: 'translate(-50%, -50%)' }),
  },
  {
    side: 'left',
    label: 'Left anchor',
    style: (_, h) => ({ left: '0px', top: `${h / 2}px`, transform: 'translate(-50%, -50%)' }),
  },
];

export default function AnchorPoints({
  itemId,
  width,
  height,
  isVisible,
  highlightedSide,
  onStartConnect,
}: AnchorPointsProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {SIDES.map(({ side, label, style }) => {
        const isHighlighted = highlightedSide === side;

        return (
          <div
            key={side}
            style={style(width, height)}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              e.preventDefault();
              onStartConnect?.(itemId, side, e);
            }}
            title={`Connect from ${label}`}
            className="absolute w-5 h-5 flex items-center justify-center cursor-crosshair pointer-events-auto select-none"
          >
            {/* Simple blue connection dot without any scale effect on hover */}
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-100 ${
                isHighlighted
                  ? 'bg-blue-600 ring-2 ring-blue-400'
                  : 'bg-blue-500 hover:bg-blue-600 ring-1.5 ring-white shadow-xs'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

