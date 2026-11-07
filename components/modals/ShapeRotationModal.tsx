'use client';

import React, { useRef, useEffect } from 'react';
import { CanvasItem } from '@/types/canvas';
import { COLOR_PRESETS } from '../toolbar/FloatingToolbar';

interface ShapeRotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CanvasItem | null;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  theme?: 'dark' | 'light';
}

export default function ShapeRotationModal({
  isOpen,
  onClose,
  item,
  onUpdate,
  theme = 'dark',
}: ShapeRotationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  // Automatically close when clicking outside the modal
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        // Don't close if user clicked the rotate trigger button on the shape
        if (!target.closest('.rotate-btn-trigger')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const rotateX = item.rotateX || 0;
  const rotateY = item.rotateY || 0;
  const rotationZ = item.rotation || 0;
  const strokeColor = item.strokeColor || (isLight ? '#2563eb' : '#3b82f6');
  const sw = item.strokeWidth || 3;

  // Inset 3D shadow for tactile, physical depth effect requested by user
  const inset3DStyle = isLight
    ? {
        boxShadow:
          'inset 0 2px 4px rgba(255, 255, 255, 0.95), inset 0 -3px 6px rgba(0, 0, 0, 0.12), inset 2px 0 4px rgba(255, 255, 255, 0.6), inset -2px 0 4px rgba(0, 0, 0, 0.08), 0 20px 40px rgba(0, 0, 0, 0.16)',
      }
    : {
        boxShadow:
          'inset 0 2px 4px rgba(255, 255, 255, 0.15), inset 0 -3px 8px rgba(0, 0, 0, 0.8), inset 2px 0 4px rgba(255, 255, 255, 0.08), inset -2px 0 4px rgba(0, 0, 0, 0.5), 0 25px 50px rgba(0, 0, 0, 0.75)',
      };

  return (
    <div className="fixed top-16 right-6 z-50 pointer-events-auto select-none animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        ref={modalRef}
        style={inset3DStyle}
        className={`w-72 p-4 rounded-2xl border backdrop-blur-2xl transition-colors duration-200 ${
          isLight
            ? 'bg-[#ffffff]/95 border-[#d8cfcf] text-[#2d2424]'
            : 'bg-[#231b1b]/95 border-[#524141] text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600/15 text-blue-500 flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">3D & 2D Rotation</div>
              <div className="text-[10px] opacity-60 capitalize font-mono">
                {item.shapeKind || 'Shape'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotation: 0, rotateX: 0, rotateY: 0 })}
              title="Reset all rotations to 0°"
              className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline cursor-pointer px-1 py-0.5"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close rotation modal"
              className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                isLight ? 'hover:bg-black/10 text-neutral-600' : 'hover:bg-white/10 text-neutral-300'
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 1. Rotate X-Axis (Pitch / Vertical Flip) */}
        <div className="flex flex-col gap-1.5 mb-3.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              X-Axis (Vertical / Pitch)
            </span>
            <span className="font-mono text-blue-500 font-bold text-xs">{rotateX}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={rotateX}
            onChange={(e) => onUpdate(item.id, { rotateX: Number(e.target.value) })}
            className="w-full accent-blue-600 h-1.5 cursor-pointer rounded-lg bg-black/10 dark:bg-white/10"
          />
          <div className="flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateX: rotateX === 180 ? 0 : 180 })}
              className={`flex-1 py-1 rounded cursor-pointer font-medium transition-colors ${
                rotateX === 180
                  ? 'bg-blue-600 text-white'
                  : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              Flip X (180°)
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateX: 0 })}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                rotateX === 0
                  ? 'bg-blue-600 text-white'
                  : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              0°
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateX: Math.min(180, rotateX + 45) })}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                isLight ? 'bg-black/5 hover:bg-black/10 text-neutral-700' : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              +45°
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateX: Math.max(-180, rotateX - 45) })}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                isLight ? 'bg-black/5 hover:bg-black/10 text-neutral-700' : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              -45°
            </button>
          </div>
        </div>

        {/* 2. Rotate Y-Axis (Yaw / Horizontal Flip) */}
        <div className="flex flex-col gap-1.5 mb-3.5 pt-2.5 border-t border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Y-Axis (Horizontal / Yaw)
            </span>
            <span className="font-mono text-indigo-500 font-bold text-xs">{rotateY}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={rotateY}
            onChange={(e) => onUpdate(item.id, { rotateY: Number(e.target.value) })}
            className="w-full accent-indigo-600 h-1.5 cursor-pointer rounded-lg bg-black/10 dark:bg-white/10"
          />
          <div className="flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateY: rotateY === 180 ? 0 : 180 })}
              className={`flex-1 py-1 rounded cursor-pointer font-medium transition-colors ${
                rotateY === 180
                  ? 'bg-indigo-600 text-white'
                  : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              Flip Y (180°)
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateY: 0 })}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                rotateY === 0
                  ? 'bg-indigo-600 text-white'
                  : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              0°
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateY: Math.min(180, rotateY + 45) })}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                isLight ? 'bg-black/5 hover:bg-black/10 text-neutral-700' : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              +45°
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateY: Math.max(-180, rotateY - 45) })}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                isLight ? 'bg-black/5 hover:bg-black/10 text-neutral-700' : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              -45°
            </button>
          </div>
        </div>

        {/* 3. 2D Rotation (Z-Axis In-Plane) */}
        <div className="flex flex-col gap-1.5 pt-2.5 border-t border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              2D Rotation (Z-Angle)
            </span>
            <span className="font-mono text-emerald-500 font-bold text-xs">{rotationZ}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={rotationZ}
            onChange={(e) => onUpdate(item.id, { rotation: Number(e.target.value) })}
            className="w-full accent-emerald-600 h-1.5 cursor-pointer rounded-lg bg-black/10 dark:bg-white/10"
          />
          <div className="flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotation: (rotationZ + 90) % 360 })}
              className={`flex-1 py-1 rounded cursor-pointer font-medium transition-colors ${
                isLight ? 'bg-black/5 hover:bg-black/10 text-neutral-700' : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              +90°
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotation: (rotationZ - 90 + 360) % 360 })}
              className={`flex-1 py-1 rounded cursor-pointer font-medium transition-colors ${
                isLight ? 'bg-black/5 hover:bg-black/10 text-neutral-700' : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              -90°
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotation: 0 })}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                rotationZ === 0
                  ? 'bg-emerald-600 text-white'
                  : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              0°
            </button>
          </div>
        </div>

        {/* 4. Quick 3D Perspectives */}
        <div className="pt-2.5 mt-2.5 border-t border-black/5 dark:border-white/10">
          <div className="text-[10px] font-semibold opacity-60 mb-1.5 uppercase tracking-wider">
            Presets
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateX: 0, rotateY: 0, rotation: 0 })}
              className={`py-1 rounded font-medium cursor-pointer transition-colors text-center ${
                rotateX === 0 && rotateY === 0 && rotationZ === 0
                  ? 'bg-blue-600 text-white'
                  : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              Flat 2D
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateX: 35, rotateY: 45, rotation: 0 })}
              className={`py-1 rounded font-medium cursor-pointer transition-colors text-center ${
                rotateX === 35 && rotateY === 45
                  ? 'bg-blue-600 text-white'
                  : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              Isometric
            </button>
            <button
              type="button"
              onClick={() => onUpdate(item.id, { rotateX: 60, rotateY: 0, rotation: 0 })}
              className={`py-1 rounded font-medium cursor-pointer transition-colors text-center ${
                rotateX === 60 && rotateY === 0
                  ? 'bg-blue-600 text-white'
                  : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-neutral-700'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              Floor View
            </button>
          </div>
        </div>

        {/* Shape Color & Style Section */}
        <div className="pt-2.5 mt-2.5 border-t border-black/10 dark:border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <span
                style={{ backgroundColor: strokeColor }}
                className="w-3 h-3 rounded-full border border-black/30 dark:border-white/30 shadow-xs inline-block"
              />
              <span>Shape Color</span>
            </span>
            <span className="font-mono text-blue-500 font-bold uppercase text-[10px]">{strokeColor}</span>
          </div>

          <div className="flex items-center justify-between gap-1">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={`Preset ${c}`}
                onClick={() => onUpdate(item.id, { strokeColor: c })}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-black/20 dark:border-white/30 ${
                  strokeColor.toLowerCase() === c.toLowerCase()
                    ? 'ring-2 ring-blue-500 scale-120 shadow-sm'
                    : 'hover:scale-110 opacity-80'
                }`}
              />
            ))}

            {/* Custom Color Picker */}
            <label
              title={`Custom Color Picker (Current: ${strokeColor})`}
              className="relative flex items-center justify-center w-5 h-5 rounded-full cursor-pointer hover:scale-120 transition-transform overflow-hidden border border-black/30 dark:border-white/40 shadow-sm ml-0.5"
              style={{
                background:
                  'conic-gradient(from 180deg at 50% 50%, #f43f5e 0deg, #eab308 60deg, #22c55e 120deg, #06b6d4 180deg, #3b82f6 240deg, #a855f7 300deg, #f43f5e 360deg)',
              }}
            >
              <input
                type="color"
                value={strokeColor.startsWith('#') ? strokeColor : '#2563eb'}
                onChange={(e) => onUpdate(item.id, { strokeColor: e.target.value })}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center justify-between gap-1 pt-1 text-[10px]">
            <span className="opacity-70 text-[10px]">Thickness:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5, 8].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdate(item.id, { strokeWidth: w })}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    sw === w
                      ? 'bg-blue-600 text-white font-bold'
                      : isLight
                      ? 'bg-black/5 hover:bg-black/10'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

