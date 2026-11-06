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
  const [notch, setNotch] = useState({ w: 38, h: 38 });

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
    const targetW = isOpen ? 228 : 38;
    const targetH = isOpen ? 272 : 38;
    const startW = notchRef.current.w;
    const startH = notchRef.current.h;

    const controls = animate(0, 1, {
      duration: 0.35,
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

  // Compute responsive frame path using exact Figma cubic bezier formulas
  const { w: W, h: H } = dims;
  const T = 20; // Top border thickness
  const L = 20; // Left border thickness
  const R = 20; // Right border thickness
  const B = 20; // Bottom border thickness

  // Bottom center shelf where floating toolbar sits (responsive & centered)
  const shelfW = Math.max(500, Math.min(W * 0.45, 540));
  const shelfHeight = 32;
  const shelfX1 = (W - shelfW) / 2;
  const shelfX2 = shelfX1 + shelfW;
  const shelfY = H - B - shelfHeight;

  const nw = notch.w;
  const nh = notch.h;

  // Exact cubic bezier offsets from Figma SVG export
  const r1 = 7, r2 = 6, r3 = 7;
  const k7 = 3.866; // 7 * (1 - 0.4477)
  const k6 = 3.314; // 6 * (1 - 0.4477)
  const k12 = 6.627; // 12 * (1 - 0.4477)

  const innerCutoutPath = [
    `M ${(L + nw + r1).toFixed(2)} ${T}`,
    // 1. Fillet into notch
    `C ${(L + nw + r1 - k7).toFixed(2)} ${T} ${(L + nw).toFixed(2)} ${(T + 7 - k7).toFixed(2)} ${(L + nw).toFixed(2)} ${(T + r1).toFixed(2)}`,
    // 2. Down notch right edge
    `V ${(T + nh - r2).toFixed(2)}`,
    // 3. Notch corner fillet
    `C ${(L + nw).toFixed(2)} ${(T + nh - r2 + k6).toFixed(2)} ${(L + nw - r2 + k6).toFixed(2)} ${(T + nh).toFixed(2)} ${(L + nw - r2).toFixed(2)} ${(T + nh).toFixed(2)}`,
    // 4. Across notch bottom
    `H ${(L + r3).toFixed(2)}`,
    // 5. Fillet out of notch to left edge
    `C ${(L + 7 - k7).toFixed(2)} ${(T + nh).toFixed(2)} ${L} ${(T + nh + 7 - k7).toFixed(2)} ${L} ${(T + nh + r3).toFixed(2)}`,
    // 6. Down left edge
    `V ${(H - B - 7).toFixed(2)}`,
    // 7. Bottom-left corner
    `C ${L} ${(H - B - 7 + k7).toFixed(2)} ${(L + 7 - k7).toFixed(2)} ${(H - B).toFixed(2)} ${(L + 7).toFixed(2)} ${(H - B).toFixed(2)}`,
    // 8. Along bottom edge to shelf
    `H ${(shelfX1 - 7).toFixed(2)}`,
    // 9. Shelf left fillet in
    `C ${(shelfX1 - 7 + k7).toFixed(2)} ${(H - B).toFixed(2)} ${shelfX1.toFixed(2)} ${(H - B - 7 + k7).toFixed(2)} ${shelfX1.toFixed(2)} ${(H - B - 7).toFixed(2)}`,
    // 10. Up left side of shelf
    `V ${(shelfY + 7).toFixed(2)}`,
    // 11. Shelf left-top fillet
    `C ${shelfX1.toFixed(2)} ${(shelfY + 7 - k7).toFixed(2)} ${(shelfX1 + 7 - k7).toFixed(2)} ${shelfY.toFixed(2)} ${(shelfX1 + 7).toFixed(2)} ${shelfY.toFixed(2)}`,
    // 12. Across shelf top
    `H ${(shelfX2 - 7).toFixed(2)}`,
    // 13. Shelf right-top fillet
    `C ${(shelfX2 - 7 + k7).toFixed(2)} ${shelfY.toFixed(2)} ${shelfX2.toFixed(2)} ${(shelfY + 7 - k7).toFixed(2)} ${shelfX2.toFixed(2)} ${(shelfY + 7).toFixed(2)}`,
    // 14. Down right side of shelf
    `V ${(H - B - 7).toFixed(2)}`,
    // 15. Shelf right fillet out
    `C ${shelfX2.toFixed(2)} ${(H - B - 7 + k7).toFixed(2)} ${(shelfX2 + 7 - k7).toFixed(2)} ${(H - B).toFixed(2)} ${(shelfX2 + 7).toFixed(2)} ${(H - B).toFixed(2)}`,
    // 16. Along bottom edge to bottom-right corner
    `H ${(W - R - 12).toFixed(2)}`,
    // 17. Bottom-right corner (R=12)
    `C ${(W - R - 12 + k12).toFixed(2)} ${(H - B).toFixed(2)} ${(W - R).toFixed(2)} ${(H - B - 12 + k12).toFixed(2)} ${(W - R).toFixed(2)} ${(H - B - 12).toFixed(2)}`,
    // 18. Up right edge
    `V ${(T + 12).toFixed(2)}`,
    // 19. Top-right corner (R=12)
    `C ${(W - R).toFixed(2)} ${(T + 12 - k12).toFixed(2)} ${(W - R - 12 + k12).toFixed(2)} ${T} ${(W - R - 12).toFixed(2)} ${T}`,
    // 20. Across top edge back to start
    `H ${(L + nw + r1).toFixed(2)}`,
    `Z`,
  ].join(' ');

  // Combined frame path: outer viewport rect + inner cutout with evenodd fill rule
  const framePath = `M ${W} ${H} H 0 V 0 H ${W} V ${H} Z ${innerCutoutPath}`;

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
        className="fixed top-[23px] left-[23px] z-40 pointer-events-auto select-none"
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
