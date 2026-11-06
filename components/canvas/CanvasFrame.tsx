'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'motion/react';
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
  const [notch, setNotch] = useState({ w: 42, h: 42 });

  // Update window dimensions
  useEffect(() => {
    const handleResize = () => {
      setDims({ w: window.innerWidth, h: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smoothly animate the SVG notch cutout dimensions when dropdown opens/closes
  const notchRef = useRef(notch);
  notchRef.current = notch;

  useEffect(() => {
    const targetW = isOpen ? 228 : 42;
    const targetH = isOpen ? 276 : 42;
    const startW = notchRef.current.w;
    const startH = notchRef.current.h;

    const controls = animate(0, 1, {
      duration: 0.38,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (progress) => {
        setNotch({
          w: Math.round(startW + (targetW - startW) * progress),
          h: Math.round(startH + (targetH - startH) * progress),
        });
      },
    });

    return () => controls.stop();
  }, [isOpen]);

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

  // Compute inner cutout path with concave and convex fillets matching user reference design
  const { w: W, h: H } = dims;
  const T = 28; // Top border thickness
  const L = 28; // Left border thickness
  const R = 28; // Right border thickness
  const B = 28; // Bottom border thickness
  const r = 16; // Corner radius

  // Bottom center shelf where floating toolbar sits
  const shelfW = Math.min(Math.max(W * 0.45, 520), 580);
  const shelfH = 46; // Extra shelf height into canvas
  const shelfX1 = (W - shelfW) / 2;
  const shelfX2 = shelfX1 + shelfW;

  const nw = notch.w;
  const nh = notch.h;

  const innerCutoutPath = [
    // 1. Start on top edge after top-left notch
    `M ${L + nw + r} ${T}`,
    // 2. Go to top-right corner
    `H ${W - R - r}`,
    `A ${r} ${r} 0 0 1 ${W - R} ${T + r}`,
    // 3. Go down right edge
    `V ${H - B - r}`,
    `A ${r} ${r} 0 0 1 ${W - R - r} ${H - B}`,
    // 4. Go left along bottom edge to right side of center shelf
    `H ${shelfX2 + r}`,
    // 5. Inverted corner into shelf right edge (concave: sweep=0)
    `A ${r} ${r} 0 0 0 ${shelfX2} ${H - B - r}`,
    // 6. Go up right side of shelf
    `V ${H - B - shelfH + r}`,
    // 7. Shelf top-right corner (convex: sweep=1)
    `A ${r} ${r} 0 0 1 ${shelfX2 - r} ${H - B - shelfH}`,
    // 8. Go across top of shelf
    `H ${shelfX1 + r}`,
    // 9. Shelf top-left corner (convex: sweep=1)
    `A ${r} ${r} 0 0 1 ${shelfX1} ${H - B - shelfH + r}`,
    // 10. Go down left side of shelf
    `V ${H - B - r}`,
    // 11. Inverted corner out of shelf left edge (concave: sweep=0)
    `A ${r} ${r} 0 0 0 ${shelfX1 - r} ${H - B}`,
    // 12. Go to bottom-left corner
    `H ${L + r}`,
    `A ${r} ${r} 0 0 1 ${L} ${H - B - r}`,
    // 13. Go up left edge to bottom of top-left notch
    `V ${T + nh + r}`,
    // 14. Inverted corner into top notch bottom (concave: sweep=0)
    `A ${r} ${r} 0 0 0 ${L + r} ${T + nh}`,
    // 15. Go across bottom of top notch
    `H ${L + nw - r}`,
    // 16. Top notch bottom-right corner (convex: sweep=1)
    `A ${r} ${r} 0 0 1 ${L + nw} ${T + nh - r}`,
    // 17. Go up right side of top notch
    `V ${T + r}`,
    // 18. Inverted corner out of top notch (concave: sweep=0)
    `A ${r} ${r} 0 0 0 ${L + nw + r} ${T}`,
    `Z`,
  ].join(' ');

  // Combined frame path: outer viewport rect + inner cutout with evenodd fill rule
  const framePath = `M 0 0 H ${W} V ${H} H 0 Z ${innerCutoutPath}`;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#403131]">
      {/* 1. SVG Definitions for Clip-Path */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="canvas-inner-cutout">
            <path d={innerCutoutPath} />
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

      {/* 3. Outer Frame Overlay SVG (Renders the #403131 bezel with pixel-perfect fillets) */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-30"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <path d={framePath} fill="#403131" fillRule="evenodd" />
      </svg>

      {/* 4. Top-Left Setting Button & Morphing Dropdown (using layoutId from motion/react) */}
      <div
        ref={dropdownRef}
        className="fixed top-2.5 left-2.5 z-40 pointer-events-auto select-none"
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isOpen ? (
            /* CLOSED STATE (Matching Image 1): Square setting button in the top-left tab */
            <motion.button
              key="closed-setting-btn"
              layoutId="settings-dropdown-box"
              type="button"
              title="Settings & Tools"
              onClick={() => setIsOpen(true)}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.8,
              }}
              className="w-8 h-8 rounded-lg bg-[#2b2222] hover:bg-[#382b2b] border border-[#524141] hover:border-[#695454] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shadow-md"
            >
              <motion.div layoutId="settings-gear-icon">
                <Settings size={16} />
              </motion.div>
            </motion.button>
          ) : (
            /* OPEN STATE (Matching Image 2): Morphing rounded container with 5 pill buttons */
            <motion.div
              key="open-setting-menu"
              layoutId="settings-dropdown-box"
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.8,
              }}
              className="w-[218px] rounded-2xl bg-[#231b1b] border border-[#524141] p-2 flex flex-col gap-1.5 shadow-2xl shadow-black/90"
            >
              {/* Menu Title / Collapse Bar */}
              <div className="flex items-center justify-between px-1 py-0.5 border-b border-white/10 mb-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                  <motion.div layoutId="settings-gear-icon">
                    <Settings size={14} className="text-white/70" />
                  </motion.div>
                  <span>Settings</span>
                </div>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Close size={13} />
                </button>
              </div>

              {/* Pill 1: Cloudinary Connect */}
              <motion.button
                type="button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 }}
                onClick={() => {
                  setIsOpen(false);
                  onOpenCloudinaryModal();
                }}
                className="w-full h-9 px-3 rounded-xl bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center justify-between text-xs font-medium transition-colors cursor-pointer shadow-sm"
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
              </motion.button>

              {/* Pill 2: Inspect JSON */}
              <motion.button
                type="button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 }}
                onClick={() => {
                  setIsOpen(false);
                  onOpenJsonModal();
                }}
                className="w-full h-9 px-3 rounded-xl bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                <Layers size={14} className="text-white/80" />
                <span>Inspect JSON</span>
              </motion.button>

              {/* Pill 3: Reset View (100%) */}
              <motion.button
                type="button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 }}
                onClick={() => {
                  setIsOpen(false);
                  onResetZoom();
                }}
                className="w-full h-9 px-3 rounded-xl bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                <ZoomIn size={14} className="text-white/80" />
                <span>Reset View (100%)</span>
              </motion.button>

              {/* Pill 4: Toggle Grid */}
              <motion.button
                type="button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.16 }}
                onClick={() => {
                  setIsOpen(false);
                  if (onToggleGrid) onToggleGrid();
                }}
                className="w-full h-9 px-3 rounded-xl bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                <Cursor size={14} className="text-white/80" />
                <span>Toggle Grid</span>
              </motion.button>

              {/* Pill 5: Clear Canvas */}
              <motion.button
                type="button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => {
                  setIsOpen(false);
                  onClearCanvas();
                }}
                className="w-full h-9 px-3 rounded-xl bg-[#4e3737] hover:bg-[#634646] active:bg-[#422e2e] text-white/90 hover:text-white flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                <Trash size={14} className="text-white/70" />
                <span>Clear Canvas</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Unclipped UI Overlays (Floating Toolbar, Modals, Toasts) */}
      {overlays}
    </div>
  );
}
