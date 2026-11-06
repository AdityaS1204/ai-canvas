'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  CloudUpload,
  Layers,
  ZoomIn,
  Cursor,
  Trash,
  Close,
} from '@honeyicons/react';

interface CanvasFrameProps {
  isCloudinaryConfigured: boolean;
  onOpenCloudinaryModal: () => void;
  onOpenJsonModal: () => void;
  onResetZoom: () => void;
  onToggleGrid?: () => void;
  onClearCanvas: () => void;
  children: React.ReactNode;
  overlays?: React.ReactNode;
}

// Pure smooth easing: no spring bounce, no overshoot, no Y-axis jitter
const SMOOTH_TRANSITION = {
  duration: 0.45,
  ease: [0.25, 1, 0.5, 1] as const,
};

export default function CanvasFrame({
  isCloudinaryConfigured,
  onOpenCloudinaryModal,
  onOpenJsonModal,
  onResetZoom,
  onToggleGrid,
  onClearCanvas,
  children,
  overlays,
}: CanvasFrameProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dims, setDims] = useState({ w: 1200, h: 800 });

  // Update window dimensions
  useEffect(() => {
    const handleResize = () => {
      setDims({ w: window.innerWidth, h: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown on outside click or escape
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Compute responsive frame path using exact Figma cubic bezier formulas
  const { w: W, h: H } = dims;
  const T = 20; // Top border thickness
  const L = 20; // Left border thickness
  const R = 20; // Right border thickness
  const B = 20; // Bottom border thickness

  // Bottom center shelf tightly sized to snugly fit the toolbar inside with even ~6-8px gap
  const shelfW = Math.min(Math.max(W - 32, 440), 468);
  const shelfHeight = 38; // Even, tight gap on top matching the bottom and side margins
  const shelfX1 = (W - shelfW) / 2;
  const shelfX2 = shelfX1 + shelfW;
  const shelfY = H - B - shelfHeight;

  // Exact cubic bezier offsets from Figma SVG export
  const r1 = 7, r2 = 6, r3 = 7;
  const k7 = 3.866; // 7 * (1 - 0.4477)
  const k6 = 3.314; // 6 * (1 - 0.4477)
  const k12 = 6.627; // 12 * (1 - 0.4477)

  // Pure mathematical SVG path generator matching closed & open command structure 1-to-1
  const generateCutout = useCallback(
    (nw: number, nh: number) => {
      return [
        `M ${(L + nw + r1).toFixed(2)} ${T.toFixed(2)}`,
        `C ${(L + nw + r1 - k7).toFixed(2)} ${T.toFixed(2)} ${(L + nw).toFixed(2)} ${(T + 7 - k7).toFixed(2)} ${(L + nw).toFixed(2)} ${(T + r1).toFixed(2)}`,
        `V ${(T + nh - r2).toFixed(2)}`,
        `C ${(L + nw).toFixed(2)} ${(T + nh - r2 + k6).toFixed(2)} ${(L + nw - r2 + k6).toFixed(2)} ${(T + nh).toFixed(2)} ${(L + nw - r2).toFixed(2)} ${(T + nh).toFixed(2)}`,
        `H ${(L + r3).toFixed(2)}`,
        `C ${(L + 7 - k7).toFixed(2)} ${(T + nh).toFixed(2)} ${L.toFixed(2)} ${(T + nh + 7 - k7).toFixed(2)} ${L.toFixed(2)} ${(T + nh + r3).toFixed(2)}`,
        `V ${(H - B - 7).toFixed(2)}`,
        `C ${L.toFixed(2)} ${(H - B - 7 + k7).toFixed(2)} ${(L + 7 - k7).toFixed(2)} ${(H - B).toFixed(2)} ${(L + 7).toFixed(2)} ${(H - B).toFixed(2)}`,
        `H ${(shelfX1 - 7).toFixed(2)}`,
        `C ${(shelfX1 - 7 + k7).toFixed(2)} ${(H - B).toFixed(2)} ${shelfX1.toFixed(2)} ${(H - B - 7 + k7).toFixed(2)} ${shelfX1.toFixed(2)} ${(H - B - 7).toFixed(2)}`,
        `V ${(shelfY + 7).toFixed(2)}`,
        `C ${shelfX1.toFixed(2)} ${(shelfY + 7 - k7).toFixed(2)} ${(shelfX1 + 7 - k7).toFixed(2)} ${shelfY.toFixed(2)} ${(shelfX1 + 7).toFixed(2)} ${shelfY.toFixed(2)}`,
        `H ${(shelfX2 - 7).toFixed(2)}`,
        `C ${(shelfX2 - 7 + k7).toFixed(2)} ${shelfY.toFixed(2)} ${shelfX2.toFixed(2)} ${(shelfY + 7 - k7).toFixed(2)} ${shelfX2.toFixed(2)} ${(shelfY + 7).toFixed(2)}`,
        `V ${(H - B - 7).toFixed(2)}`,
        `C ${shelfX2.toFixed(2)} ${(H - B - 7 + k7).toFixed(2)} ${(shelfX2 + 7 - k7).toFixed(2)} ${(H - B).toFixed(2)} ${(shelfX2 + 7).toFixed(2)} ${(H - B).toFixed(2)}`,
        `H ${(W - R - 12).toFixed(2)}`,
        `C ${(W - R - 12 + k12).toFixed(2)} ${(H - B).toFixed(2)} ${(W - R).toFixed(2)} ${(H - B - 12 + k12).toFixed(2)} ${(W - R).toFixed(2)} ${(H - B - 12).toFixed(2)}`,
        `V ${(T + 12).toFixed(2)}`,
        `C ${(W - R).toFixed(2)} ${(T + 12 - k12).toFixed(2)} ${(W - R - 12 + k12).toFixed(2)} ${T.toFixed(2)} ${(W - R - 12).toFixed(2)} ${T.toFixed(2)}`,
        `H ${(L + nw + r1).toFixed(2)}`,
        `Z`,
      ].join(' ');
    },
    [W, H, L, T, R, B, shelfX1, shelfX2, shelfY]
  );

  const closedInnerPath = useMemo(() => generateCutout(38, 38), [generateCutout]);
  const openInnerPath = useMemo(() => generateCutout(228, 272), [generateCutout]);

  const closedFramePath = useMemo(
    () => `M ${W.toFixed(2)} ${H.toFixed(2)} H 0.00 V 0.00 H ${W.toFixed(2)} V ${H.toFixed(2)} Z ${closedInnerPath}`,
    [W, H, closedInnerPath]
  );
  const openFramePath = useMemo(
    () => `M ${W.toFixed(2)} ${H.toFixed(2)} H 0.00 V 0.00 H ${W.toFixed(2)} V ${H.toFixed(2)} Z ${openInnerPath}`,
    [W, H, openInnerPath]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#403131]">
      {/* 1. SVG Definitions for Clip-Path: Motion interpolates path numbers smoothly without React re-renders */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="canvas-inner-cutout">
            <motion.path
              animate={{ d: isOpen ? openInnerPath : closedInnerPath }}
              transition={SMOOTH_TRANSITION}
            />
          </clipPath>
        </defs>
      </svg>

      {/* 2. Inner Canvas Container: clipped smoothly by the dynamic frame */}
      <div
        className="absolute inset-0 bg-[#221b1b] overflow-hidden"
        style={{
          clipPath: 'url(#canvas-inner-cutout)',
          WebkitClipPath: 'url(#canvas-inner-cutout)',
        }}
      >
        {children}
      </div>

      {/* 3. Outer Frame Overlay SVG (Hardware-accelerated Motion path morphing with smooth easing) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-30"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <motion.path
          animate={{ d: isOpen ? openFramePath : closedFramePath }}
          transition={SMOOTH_TRANSITION}
          fill="#403131"
          fillRule="evenodd"
        />
      </svg>

      {/* 4. Top-Left Setting Button & Dropdown: Single pinned container that expands down-right with rounded-md */}
      <motion.div
        ref={dropdownRef}
        animate={{
          width: isOpen ? 218 : 32,
          height: isOpen ? 254 : 32,
          borderRadius: 6,
        }}
        transition={SMOOTH_TRANSITION}
        className="fixed top-[23px] left-[23px] z-40 bg-[#231b1b] border border-[#524141] rounded-md shadow-2xl shadow-black/90 overflow-hidden select-none pointer-events-auto"
        style={{ transformOrigin: '0 0' }}
      >
        {/* Header / Button Hitbox: Gear icon stays firmly at top-left at all times */}
        <div
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
          className={`flex items-center justify-between w-full h-8 px-2 transition-colors ${
            !isOpen
              ? 'cursor-pointer hover:bg-white/5 active:bg-white/10'
              : 'border-b border-white/10'
          }`}
          title={!isOpen ? 'Settings & Tools' : undefined}
          role={!isOpen ? 'button' : undefined}
          aria-label="Settings"
        >
          <div className="flex items-center gap-2">
            <Settings size={15} className={isOpen ? 'text-white/70' : 'text-white/80'} />
            <motion.span
              animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
              transition={SMOOTH_TRANSITION}
              className="text-xs font-semibold text-white/90 whitespace-nowrap overflow-hidden"
            >
              Settings
            </motion.span>
          </div>

          {isOpen && (
            <button
              type="button"
              aria-label="Close settings"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Close size={13} />
            </button>
          )}
        </div>

        {/* Dropdown Menu Items: Fade in cleanly once open, fade out immediately on close */}
        <motion.div
          animate={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
          transition={{ duration: isOpen ? 0.3 : 0.15, delay: isOpen ? 0.1 : 0 }}
          className="p-2 flex flex-col gap-1.5"
        >
          {/* Pill 1: Cloudinary Connect */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCloudinaryModal();
            }}
            className="w-full h-9 px-3 rounded-md bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center justify-between text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CloudUpload size={14} className="text-blue-400" />
              <span>Cloudinary</span>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudinaryConfigured ? 'bg-blue-400' : 'bg-white/30'
              }`}
              title={isCloudinaryConfigured ? 'Configured' : 'Not configured'}
            />
          </button>

          {/* Pill 2: Inspect JSON */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenJsonModal();
            }}
            className="w-full h-9 px-3 rounded-md bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Layers size={14} className="text-white/80" />
            <span>Inspect JSON</span>
          </button>

          {/* Pill 3: Reset View (100%) */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onResetZoom();
            }}
            className="w-full h-9 px-3 rounded-md bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <ZoomIn size={14} className="text-white/80" />
            <span>Reset View (100%)</span>
          </button>

          {/* Pill 4: Toggle Grid */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (onToggleGrid) onToggleGrid();
            }}
            className="w-full h-9 px-3 rounded-md bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Cursor size={14} className="text-white/80" />
            <span>Toggle Grid</span>
          </button>

          {/* Pill 5: Clear Canvas */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onClearCanvas();
            }}
            className="w-full h-9 px-3 rounded-md bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Trash size={14} className="text-white/70" />
            <span>Clear Canvas</span>
          </button>
        </motion.div>
      </motion.div>

      {/* 5. Unclipped UI Overlays (Floating Toolbar, Modals, Toasts) */}
      {overlays}
    </div>
  );
}
