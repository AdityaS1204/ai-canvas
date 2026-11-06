'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  CloudUpload,
  Layers,
  ZoomIn,
  Sun,
  Moon,
  Trash,
  Close,
} from '@honeyicons/react';

interface CanvasFrameProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isCloudinaryConfigured: boolean;
  onOpenCloudinaryModal: () => void;
  onOpenJsonModal: () => void;
  onResetZoom: () => void;
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
  theme = 'dark',
  onToggleTheme,
  isCloudinaryConfigured,
  onOpenCloudinaryModal,
  onOpenJsonModal,
  onResetZoom,
  onClearCanvas,
  children,
  overlays,
}: CanvasFrameProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dims, setDims] = useState({ w: 1200, h: 800 });

  const isLight = theme === 'light';
  const frameColor = isLight ? '#ded6d6' : '#403131';

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
  const shelfW = Math.min(Math.max(W - 32, 380), 438);
  const shelfHeight = 36; // Snug top clearance matching the bottom and side margins
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
  const openInnerPath = useMemo(() => generateCutout(224, 218), [generateCutout]);

  const closedFramePath = useMemo(
    () => `M ${W.toFixed(2)} ${H.toFixed(2)} H 0.00 V 0.00 H ${W.toFixed(2)} V ${H.toFixed(2)} Z ${closedInnerPath}`,
    [W, H, closedInnerPath]
  );
  const openFramePath = useMemo(
    () => `M ${W.toFixed(2)} ${H.toFixed(2)} H 0.00 V 0.00 H ${W.toFixed(2)} V ${H.toFixed(2)} Z ${openInnerPath}`,
    [W, H, openInnerPath]
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-[#ded6d6]' : 'bg-[#403131]'
      }`}
    >
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
        className={`absolute inset-0 overflow-hidden transition-colors duration-300 ${
          isLight ? 'bg-[#f7f4f4]' : 'bg-[#221b1b]'
        }`}
        style={{
          clipPath: 'url(#canvas-inner-cutout)',
          WebkitClipPath: 'url(#canvas-inner-cutout)',
        }}
      >
        {children}
      </div>

      {/* 3. Outer Frame Overlay SVG (Hardware-accelerated Motion path morphing with 3D depth filter) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-30"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="frame-3d-depth" x="-5%" y="-5%" width="110%" height="110%">
            {/* Deep shadow cast inward onto the canvas */}
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#000000"
              floodOpacity={isLight ? 0.16 : 0.8}
            />
            {/* Subtle ambient contact occlusion */}
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="2"
              floodColor="#000000"
              floodOpacity={isLight ? 0.1 : 0.6}
            />
          </filter>
        </defs>
        <motion.path
          animate={{ d: isOpen ? openFramePath : closedFramePath }}
          transition={SMOOTH_TRANSITION}
          fill={frameColor}
          fillRule="evenodd"
          filter="url(#frame-3d-depth)"
          stroke={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
          strokeWidth="1"
        />
      </svg>

      {/* 4. Top-Left Setting Button & Dropdown: Single pinned container with rounded-md */}
      <motion.div
        ref={dropdownRef}
        animate={{
          width: isOpen ? 218 : 32,
          height: isOpen ? 212 : 32,
          borderRadius: 6,
        }}
        transition={SMOOTH_TRANSITION}
        className={`fixed top-[23px] left-[23px] z-40 border rounded-md shadow-2xl overflow-hidden select-none pointer-events-auto transition-colors duration-200 ${
          isLight
            ? 'bg-[#ffffff] border-[#d8cfcf] text-[#2d2424] shadow-black/10'
            : 'bg-[#231b1b] border-[#524141] text-white shadow-black/90'
        }`}
        style={{ transformOrigin: '0 0' }}
      >
        {/* Header / Button Hitbox: Gear icon stays firmly at top-left at all times */}
        <div
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
          className={`flex items-center justify-between w-full h-8 px-2 transition-colors ${
            !isOpen
              ? isLight
                ? 'cursor-pointer hover:bg-black/5 active:bg-black/10'
                : 'cursor-pointer hover:bg-white/5 active:bg-white/10'
              : isLight
              ? 'border-b border-black/10'
              : 'border-b border-white/10'
          }`}
          title={!isOpen ? 'Settings & Tools' : undefined}
          role={!isOpen ? 'button' : undefined}
          aria-label="Settings"
        >
          <div className="flex items-center gap-2">
            <Settings
              size={15}
              className={
                isOpen
                  ? isLight
                    ? 'text-[#6e5d5d]'
                    : 'text-white/70'
                  : isLight
                  ? 'text-[#382d2d]'
                  : 'text-white/80'
              }
            />
            <motion.span
              animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
              transition={SMOOTH_TRANSITION}
              className={`text-xs font-semibold whitespace-nowrap overflow-hidden ${
                isLight ? 'text-[#2d2424]' : 'text-white/90'
              }`}
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
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isLight
                  ? 'text-black/50 hover:text-black hover:bg-black/5'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Close size={13} />
            </button>
          )}
        </div>

        {/* Dropdown Menu Items */}
        <motion.div
          animate={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
          transition={{ duration: isOpen ? 0.3 : 0.15, delay: isOpen ? 0.1 : 0 }}
          className="p-1.5 flex flex-col gap-0.5"
        >
          {/* Item 1: Cloudinary Connect */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCloudinaryModal();
            }}
            className={`w-full h-8 px-2.5 rounded-md flex items-center justify-between text-xs font-medium transition-colors duration-150 cursor-pointer ${
              isLight
                ? 'text-[#2d2424] hover:bg-black/5 active:bg-black/10'
                : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15'
            }`}
          >
            <div className="flex items-center gap-2">
              <CloudUpload size={14} className={isLight ? 'text-blue-600' : 'text-blue-400'} />
              <span>Cloudinary</span>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudinaryConfigured
                  ? isLight
                    ? 'bg-blue-600'
                    : 'bg-blue-400'
                  : isLight
                  ? 'bg-black/20'
                  : 'bg-white/20'
              }`}
              title={isCloudinaryConfigured ? 'Configured' : 'Not configured'}
            />
          </button>

          {/* Item 2: Inspect JSON */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenJsonModal();
            }}
            className={`w-full h-8 px-2.5 rounded-md flex items-center gap-2 text-xs font-medium transition-colors duration-150 cursor-pointer ${
              isLight
                ? 'text-[#2d2424] hover:bg-black/5 active:bg-black/10'
                : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15'
            }`}
          >
            <Layers size={14} className={isLight ? 'text-[#6e5d5d]' : 'text-white/70'} />
            <span>Inspect JSON</span>
          </button>

          {/* Item 3: Reset View (100%) */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onResetZoom();
            }}
            className={`w-full h-8 px-2.5 rounded-md flex items-center gap-2 text-xs font-medium transition-colors duration-150 cursor-pointer ${
              isLight
                ? 'text-[#2d2424] hover:bg-black/5 active:bg-black/10'
                : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15'
            }`}
          >
            <ZoomIn size={14} className={isLight ? 'text-[#6e5d5d]' : 'text-white/70'} />
            <span>Reset View (100%)</span>
          </button>

          {/* Item 4: Theme Toggle Option */}
          <button
            type="button"
            onClick={() => {
              if (onToggleTheme) onToggleTheme();
            }}
            className={`w-full h-8 px-2.5 rounded-md flex items-center justify-between text-xs font-medium transition-colors duration-150 cursor-pointer ${
              isLight
                ? 'text-[#2d2424] hover:bg-black/5 active:bg-black/10'
                : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15'
            }`}
          >
            <div className="flex items-center gap-2">
              {isLight ? (
                <Sun size={14} className="text-amber-500" />
              ) : (
                <Moon size={14} className="text-blue-400" />
              )}
              <span>{isLight ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            {/* Animated toggle pill */}
            <div
              className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                isLight ? 'bg-blue-600 justify-end' : 'bg-black/40 justify-start'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          {/* Item 5: Clear Canvas */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onClearCanvas();
            }}
            className={`w-full h-8 px-2.5 rounded-md flex items-center gap-2 text-xs font-medium transition-colors duration-150 cursor-pointer ${
              isLight
                ? 'text-[#c23b3b] hover:bg-red-500/10 active:bg-red-500/15'
                : 'text-red-400 hover:text-red-300 hover:bg-red-500/15 active:bg-red-500/20'
            }`}
          >
            <Trash size={14} className={isLight ? 'text-[#c23b3b]' : 'text-red-400'} />
            <span>Clear Canvas</span>
          </button>
        </motion.div>
      </motion.div>

      {/* 5. Unclipped UI Overlays (Floating Toolbar, Modals, Toasts) */}
      {overlays}
    </div>
  );
}
