'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ActiveTool, ShapeKind } from '@/types/canvas';
import {
  Pen,
  Eraser,
  FileText,
  Image as ImageIcon,
  FileVideo,
  MusicNote,
  Pointer,
  Hand,
  ZoomIn,
  ZoomOut,
  MoreHorizontal,
  MoreVertical,
} from '@honeyicons/react';

interface FloatingToolbarProps {
  theme?: 'dark' | 'light';
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penWidth: number;
  setPenWidth: (w: number) => void;
  shapeColor?: string;
  setShapeColor?: (color: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onAddTextBox: () => void;
  onOpenUploadModal: (type: 'image' | 'video' | 'audio') => void;
  onOpenJsonModal?: () => void;
  onOpenCloudinaryModal?: () => void;
  onClearCanvas: () => void;
  onAddShape: (kind: ShapeKind) => void;
  onDimensionsChange?: (dims: { width: number; height: number }) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenAiAgent?: () => void;
}

// Preset color palette for pen and shapes
export const COLOR_PRESETS = [
  '#2563eb', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber / Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#000000', // Black
];

interface ToolbarTooltipProps {
  label: string;
  shortcut?: string;
  hidden?: boolean;
  isLight?: boolean;
  children: React.ReactNode;
}

function ToolbarTooltip({
  label,
  shortcut,
  hidden = false,
  isLight = false,
  children,
}: ToolbarTooltipProps) {
  return (
    <div className="relative group/tooltip flex items-center justify-center">
      {children}
      {!hidden && (
        <div
          className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-medium shadow-xl opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-150 z-50 whitespace-nowrap ${
            isLight
              ? 'bg-[#ffffff] border-[#d8cfcf] text-[#2d2424] shadow-black/10'
              : 'bg-[#281f1f] border-[#524141] text-white/95 shadow-black/80'
          }`}
        >
          <span>{label}</span>
          {shortcut && (
            <kbd
              className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono leading-none ${
                isLight ? 'bg-black/10 text-black/70' : 'bg-white/10 text-white/70'
              }`}
            >
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}

// Clean Shapes icon matching standard design tool iconography
function ShapeIcon({ size = 17, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="11" height="11" rx="2.5" />
      <circle cx="15.5" cy="15.5" r="5.5" />
    </svg>
  );
}

// Basic shapes list with vector icons
const SHAPES_LIST: { kind: ShapeKind; label: string; icon: React.ReactNode }[] = [
  {
    kind: 'rectangle',
    label: 'Rectangle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
      </svg>
    ),
  },
  {
    kind: 'circle',
    label: 'Circle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    kind: 'line',
    label: 'Line',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="20" x2="20" y2="4" />
      </svg>
    ),
  },
  {
    kind: 'arrow',
    label: 'Arrow',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="19" x2="19" y2="5" />
        <polyline points="10 5 19 5 19 14" />
      </svg>
    ),
  },
];

export default function FloatingToolbar({
  theme = 'dark',
  activeTool,
  setActiveTool,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  shapeColor = '#2563eb',
  setShapeColor,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onAddTextBox,
  onOpenUploadModal,
  onOpenJsonModal,
  onOpenCloudinaryModal,
  onAddShape,
  onDimensionsChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenAiAgent,
}: FloatingToolbarProps) {
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const shapesRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  // Close shapes menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (shapesRef.current && !shapesRef.current.contains(e.target as Node)) {
        setShowShapesMenu(false);
      }
    };
    if (showShapesMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showShapesMenu]);

  // Close more menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMoreMenu]);

  // Report measured toolbar dimensions to align the SVG notch shelf pixel-perfectly
  useEffect(() => {
    const el = toolbarContainerRef.current;
    if (!el || !onDimensionsChange) return;

    const reportSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        onDimensionsChange({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    reportSize();

    const resizeObserver = new ResizeObserver(() => {
      reportSize();
    });
    resizeObserver.observe(el);

    window.addEventListener('resize', reportSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', reportSize);
    };
  }, [onDimensionsChange]);

  const inactiveBtnClass = isLight
    ? 'text-[#2d2424] hover:text-black hover:bg-black/5 active:bg-black/10'
    : 'text-white/80 hover:text-white hover:bg-white/10 active:bg-white/15';

  // Responsive device width tracking
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Priority-ordered tool definitions for mobile responsive slicing (like Excalidraw)
  const TOOL_DEFS = [
    {
      id: 'select',
      label: 'Select tool',
      shortcut: 'V',
      icon: <Pointer size={18} />,
      onClick: () => {
        setActiveTool('select');
        setShowPenOptions(false);
        setShowShapesMenu(false);
        setShowMoreMenu(false);
      },
      isActive: activeTool === 'select',
    },
    {
      id: 'hand',
      label: 'Hand tool',
      shortcut: 'H',
      icon: <Hand size={18} />,
      onClick: () => {
        setActiveTool('hand');
        setShowPenOptions(false);
        setShowShapesMenu(false);
        setShowMoreMenu(false);
      },
      isActive: activeTool === 'hand',
    },
    {
      id: 'pen',
      label: 'Draw / Pen',
      shortcut: 'P',
      icon: (
        <span className="relative flex items-center justify-center">
          <Pen size={18} />
          <span
            style={{ backgroundColor: penColor }}
            className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-black shadow-xs"
          />
        </span>
      ),
      onClick: () => {
        setActiveTool('pen');
        setShowMoreMenu(false);
        setShowShapesMenu(false);
        setShowPenOptions(!showPenOptions || activeTool !== 'pen');
      },
      isActive: activeTool === 'pen',
    },
    {
      id: 'eraser',
      label: 'Eraser',
      shortcut: 'E',
      icon: <Eraser size={18} />,
      onClick: () => {
        setActiveTool('eraser');
        setShowPenOptions(false);
        setShowShapesMenu(false);
        setShowMoreMenu(false);
      },
      isActive: activeTool === 'eraser',
    },
    {
      id: 'shape',
      label: 'Shapes',
      shortcut: 'S',
      icon: (
        <span className="relative flex items-center justify-center">
          <ShapeIcon size={18} />
          <span
            style={{ backgroundColor: shapeColor }}
            className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-black shadow-xs"
          />
        </span>
      ),
      onClick: () => {
        setShowShapesMenu((prev) => !prev);
        setShowPenOptions(false);
        setShowMoreMenu(false);
      },
      isActive: showShapesMenu || activeTool === 'shape',
    },
    {
      id: 'text',
      label: 'Add Text',
      icon: <FileText size={18} />,
      onClick: () => {
        setShowPenOptions(false);
        setShowShapesMenu(false);
        setShowMoreMenu(false);
        onAddTextBox();
      },
      isActive: false,
    },
    {
      id: 'image',
      label: 'Add Image',
      icon: <ImageIcon size={18} />,
      onClick: () => {
        setShowPenOptions(false);
        setShowShapesMenu(false);
        setShowMoreMenu(false);
        onOpenUploadModal('image');
      },
      isActive: false,
    },
    {
      id: 'video',
      label: 'Add Video',
      icon: <FileVideo size={18} />,
      onClick: () => {
        setShowPenOptions(false);
        setShowShapesMenu(false);
        setShowMoreMenu(false);
        onOpenUploadModal('video');
      },
      isActive: false,
    },
    {
      id: 'audio',
      label: 'Add Audio',
      icon: <MusicNote size={18} />,
      onClick: () => {
        setShowPenOptions(false);
        setShowShapesMenu(false);
        setShowMoreMenu(false);
        onOpenUploadModal('audio');
      },
      isActive: false,
    },
    ...(onOpenAiAgent
      ? [
          {
            id: 'agent',
            label: 'Gemini AI Agent',
            shortcut: 'Ctrl+K',
            icon: <span className="text-base font-bold text-blue-500 dark:text-blue-400">✦</span>,
            onClick: () => {
              setShowPenOptions(false);
              setShowShapesMenu(false);
              setShowMoreMenu(false);
              onOpenAiAgent();
            },
            isActive: false,
          },
        ]
      : []),
  ];

  // Calculate visible tools count dynamically for mobile viewports
  let mobileVisibleCount = 4;
  if (windowWidth < 360) {
    mobileVisibleCount = 4;
  } else if (windowWidth < 410) {
    mobileVisibleCount = 5;
  } else if (windowWidth < 470) {
    mobileVisibleCount = 6;
  } else if (windowWidth < 540) {
    mobileVisibleCount = 7;
  } else {
    mobileVisibleCount = 8;
  }

  let visibleMobileTools = TOOL_DEFS.slice(0, mobileVisibleCount);
  let overflowMobileTools = TOOL_DEFS.slice(mobileVisibleCount);

  // If the active tool is currently in overflow, elevate it so it stays visible and highlighted
  const activeToolIndex = TOOL_DEFS.findIndex((t) => t.isActive);
  if (activeToolIndex >= mobileVisibleCount) {
    const activeToolDef = TOOL_DEFS[activeToolIndex];
    const displacedToolDef = visibleMobileTools[visibleMobileTools.length - 1];
    visibleMobileTools = [
      ...visibleMobileTools.slice(0, visibleMobileTools.length - 1),
      activeToolDef,
    ];
    overflowMobileTools = [
      displacedToolDef,
      ...overflowMobileTools.filter((t) => t.id !== activeToolDef.id),
    ];
  }

  return (
    <div className="fixed bottom-3 md:bottom-1.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none pointer-events-auto max-w-[calc(100vw-16px)]">
      {/* Mobile Floating Top Row: Active Tool Options/Swatch (Left) & Undo/Redo Pill (Right) - Excalidraw Style */}
      <div className="flex md:hidden items-center justify-between w-full max-w-[calc(100vw-24px)] px-1 pointer-events-none mb-1.5">
        {/* Left: Active Tool Swatch / Stroke preview */}
        <div className="pointer-events-auto">
          {activeTool === 'pen' || activeTool === 'shape' ? (
            <button
              type="button"
              onClick={() => {
                if (activeTool === 'pen') {
                  setShowPenOptions((prev) => !prev);
                  setShowShapesMenu(false);
                } else if (activeTool === 'shape') {
                  setShowShapesMenu((prev) => !prev);
                  setShowPenOptions(false);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xl backdrop-blur-xl transition-all active:scale-95 cursor-pointer ${
                isLight
                  ? 'bg-white/95 border-[#c8bebe] shadow-black/15 text-[#2d2424]'
                  : 'bg-[#1f1717]/95 border-[#4e3c3c] shadow-black/70 text-white'
              }`}
              title="Tool Options"
            >
              <span
                style={{ backgroundColor: activeTool === 'shape' ? shapeColor : penColor }}
                className="w-5 h-5 rounded-lg border border-black/20 dark:border-white/20 shadow-sm"
              />
              <span className="text-[11px] font-mono font-medium px-0.5">
                {activeTool === 'pen' ? `${penWidth}px` : 'Shape'}
              </span>
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Right: Floating Undo & Redo Pill (Excalidraw style) */}
        {(onUndo || onRedo) && (
          <div
            className={`pointer-events-auto flex items-center gap-1 p-1 rounded-xl border shadow-xl backdrop-blur-xl transition-all ${
              isLight
                ? 'bg-white/95 border-[#c8bebe] shadow-black/15'
                : 'bg-[#1f1717]/95 border-[#4e3c3c] shadow-black/70'
            }`}
          >
            {onUndo && (
              <button
                type="button"
                disabled={!canUndo}
                aria-label="Undo"
                onClick={onUndo}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  !canUndo
                    ? 'opacity-30 cursor-not-allowed text-neutral-400'
                    : isLight
                    ? 'text-[#2d2424] hover:bg-black/5 active:bg-black/10'
                    : 'text-white hover:bg-white/10 active:bg-white/15'
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              </button>
            )}

            {onRedo && (
              <button
                type="button"
                disabled={!canRedo}
                aria-label="Redo"
                onClick={onRedo}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  !canRedo
                    ? 'opacity-30 cursor-not-allowed text-neutral-400'
                    : isLight
                    ? 'text-[#2d2424] hover:bg-black/5 active:bg-black/10'
                    : 'text-white hover:bg-white/10 active:bg-white/15'
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Shapes Options Popup */}
      {showShapesMenu && (
        <div
          ref={shapesRef}
          className={`flex items-center gap-1.5 p-1.5 rounded-xl backdrop-blur-xl border shadow-2xl z-50 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap ${
            isLight
              ? 'bg-white/95 border-[#c8bebe] text-[#2d2424] shadow-black/15'
              : 'bg-[#1f1717]/95 border-[#4e3c3c] text-white shadow-black/80'
          }`}
        >
          {/* Shape Kind Buttons */}
          <div className="flex items-center gap-1">
            {SHAPES_LIST.map((shape) => (
              <ToolbarTooltip key={shape.kind} label={shape.label} isLight={isLight}>
                <button
                  type="button"
                  aria-label={`Add ${shape.label}`}
                  onClick={() => {
                    onAddShape?.(shape.kind);
                    setActiveTool('select');
                    setShowShapesMenu(false);
                  }}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${
                    isLight
                      ? 'text-[#2d2424] hover:text-black hover:bg-black/5'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {shape.icon}
                </button>
              </ToolbarTooltip>
            ))}
          </div>

          {/* Divider */}
          <div className={`h-5 w-[1px] ${isLight ? 'bg-black/15' : 'bg-white/15'}`} />

          {/* Shape Color Options & Picker */}
          <div className="flex items-center gap-1 px-1">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={`Shape color: ${c}`}
                onClick={() => setShapeColor?.(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full transition-transform cursor-pointer border border-black/20 dark:border-white/30 ${
                  shapeColor.toLowerCase() === c.toLowerCase()
                    ? 'ring-2 ring-blue-500 scale-125 shadow-sm'
                    : 'hover:scale-110 opacity-80'
                }`}
              />
            ))}

            {/* Custom Color Picker for Shapes */}
            <label
              title={`Custom Shape Color (Current: ${shapeColor})`}
              className="relative flex items-center justify-center w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform overflow-hidden border border-black/30 dark:border-white/40 shadow-sm ml-0.5"
              style={{
                background:
                  'conic-gradient(from 180deg at 50% 50%, #f43f5e 0deg, #eab308 60deg, #22c55e 120deg, #06b6d4 180deg, #3b82f6 240deg, #a855f7 300deg, #f43f5e 360deg)',
              }}
            >
              <input
                type="color"
                value={shapeColor.startsWith('#') ? shapeColor : '#2563eb'}
                onChange={(e) => setShapeColor?.(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* Pen Options Popup */}
      {showPenOptions && activeTool === 'pen' && (
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl backdrop-blur-xl border shadow-2xl mb-2 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isLight
              ? 'bg-white/95 border-[#c8bebe] text-[#2d2424] shadow-black/15'
              : 'bg-[#1f1717]/95 border-[#4e3c3c] text-white shadow-black/80'
          }`}
        >
          {/* Preset Swatches & Custom Color Picker for Pen */}
          <div className="flex items-center gap-1.5">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={`Pen color: ${c}`}
                onClick={() => setPenColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-black/20 dark:border-white/30 ${
                  penColor.toLowerCase() === c.toLowerCase()
                    ? 'ring-2 ring-blue-500 scale-110 shadow-sm'
                    : 'hover:scale-105 opacity-85'
                }`}
              />
            ))}

            {/* Custom Color Picker for Pen */}
            <label
              title={`Custom Pen Color (Current: ${penColor})`}
              className="relative flex items-center justify-center w-5 h-5 rounded-full cursor-pointer hover:scale-115 transition-transform overflow-hidden border border-black/30 dark:border-white/40 shadow-sm ml-0.5"
              style={{
                background:
                  'conic-gradient(from 180deg at 50% 50%, #f43f5e 0deg, #eab308 60deg, #22c55e 120deg, #06b6d4 180deg, #3b82f6 240deg, #a855f7 300deg, #f43f5e 360deg)',
              }}
            >
              <input
                type="color"
                value={penColor.startsWith('#') ? penColor : '#2563eb'}
                onChange={(e) => setPenColor(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>

          <div className={`h-4 w-[1px] ${isLight ? 'bg-black/20' : 'bg-white/20'}`} />

          {/* Pen widths */}
          <div
            className={`flex items-center gap-2 text-xs ${
              isLight ? 'text-[#5a4848]' : 'text-white/70'
            }`}
          >
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setPenWidth(w)}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  penWidth === w
                    ? 'bg-blue-600 text-white font-medium'
                    : isLight
                    ? 'hover:text-[#18181b]'
                    : 'hover:text-white'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Floating Toolbar - High contrast, elevated, and responsive */}
      <div
        ref={toolbarContainerRef}
        className={`flex items-center gap-1 p-1 sm:p-1.5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? 'bg-white/95 border-[#c8bebe] shadow-[0_8px_32px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.08)] backdrop-blur-xl'
            : 'bg-[#1f1717]/95 border-[#4e3c3c] shadow-[0_8px_32px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.4)] backdrop-blur-xl'
        }`}
      >
        {/* ============================================================== */}
        {/* 1. MOBILE RESPONSIVE TOOLBAR (flex md:hidden)                   */}
        {/* ============================================================== */}
        <div className="flex md:hidden items-center gap-1">
          {visibleMobileTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              aria-label={tool.label}
              onClick={tool.onClick}
              className={`flex items-center justify-center w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl transition-all cursor-pointer ${
                tool.isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-medium'
                  : inactiveBtnClass
              }`}
            >
              {tool.icon}
            </button>
          ))}

          {/* Three-dots More button on Mobile */}
          <div ref={moreMenuRef} className="relative flex items-center">
            <button
              type="button"
              aria-label="More tools"
              onClick={() => {
                setShowPenOptions(false);
                setShowShapesMenu(false);
                setShowMoreMenu(!showMoreMenu);
              }}
              className={`flex items-center justify-center w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-xl transition-all cursor-pointer ${
                showMoreMenu
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : inactiveBtnClass
              }`}
            >
              <MoreVertical size={18} />
            </button>

            {/* Upward Dropdown for Overflow Tools */}
            {showMoreMenu && (
              <div
                className={`absolute bottom-full right-0 mb-2.5 w-48 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 z-50 flex flex-col gap-0.5 ${
                  isLight
                    ? 'bg-white/95 border-[#c8bebe] text-[#2d2424] shadow-black/20'
                    : 'bg-[#1f1717]/95 border-[#4e3c3c] text-white shadow-black/90'
                }`}
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase opacity-50 select-none">
                  More Tools
                </div>

                {overflowMobileTools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={tool.onClick}
                    className={`w-full h-8.5 px-2.5 rounded-xl flex items-center gap-2.5 text-xs font-medium transition-colors cursor-pointer ${
                      tool.isActive
                        ? 'bg-blue-600 text-white font-semibold'
                        : isLight
                        ? 'text-[#2d2424] hover:bg-black/5 active:bg-black/10'
                        : 'text-white/90 hover:bg-white/10 active:bg-white/15'
                    }`}
                  >
                    <span className="w-5 flex items-center justify-center">{tool.icon}</span>
                    <span>{tool.label}</span>
                  </button>
                ))}

                <div className={`h-[1px] my-1 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

                {/* Reset Zoom Item */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onResetZoom();
                  }}
                  className={`w-full h-8.5 px-2.5 rounded-xl flex items-center justify-between text-xs font-medium transition-colors cursor-pointer ${
                    isLight
                      ? 'text-[#2d2424] hover:bg-black/5 active:bg-black/10'
                      : 'text-white/90 hover:bg-white/10 active:bg-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ZoomIn size={15} className="opacity-70" />
                    <span>Reset Zoom</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">{Math.round(zoom * 100)}%</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. DESKTOP FULL TOOLBAR (hidden md:flex)                        */}
        {/* ============================================================== */}
        <div className="hidden md:flex items-center gap-1">
          {/* Selection / Cursor tool */}
          <ToolbarTooltip label="Select tool" shortcut="V" isLight={isLight}>
            <button
              type="button"
              aria-label="Select tool"
              onClick={() => {
                setActiveTool('select');
                setShowPenOptions(false);
                setShowShapesMenu(false);
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
                activeTool === 'select'
                  ? 'bg-blue-600 text-white shadow-md'
                  : inactiveBtnClass
              }`}
            >
              <Pointer size={17} />
            </button>
          </ToolbarTooltip>

          {/* Hand / Pan canvas tool */}
          <ToolbarTooltip label="Hand tool" shortcut="H" isLight={isLight}>
            <button
              type="button"
              aria-label="Hand tool"
              onClick={() => {
                setActiveTool('hand');
                setShowPenOptions(false);
                setShowShapesMenu(false);
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
                activeTool === 'hand'
                  ? 'bg-blue-600 text-white shadow-md'
                  : inactiveBtnClass
              }`}
            >
              <Hand size={17} />
            </button>
          </ToolbarTooltip>

          {/* Pen tool */}
          <ToolbarTooltip
            label="Draw / Pen"
            shortcut="P"
            hidden={showPenOptions && activeTool === 'pen'}
            isLight={isLight}
          >
            <button
              type="button"
              aria-label="Pen tool"
              onClick={() => {
                setActiveTool('pen');
                setShowShapesMenu(false);
                setShowPenOptions(!showPenOptions || activeTool !== 'pen');
              }}
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-blue-600 text-white shadow-md'
                  : inactiveBtnClass
              }`}
            >
              <Pen size={17} />
              <span
                style={{ backgroundColor: penColor }}
                className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black"
              />
            </button>
          </ToolbarTooltip>

          {/* Eraser tool */}
          <ToolbarTooltip label="Eraser" shortcut="E" isLight={isLight}>
            <button
              type="button"
              aria-label="Eraser tool"
              onClick={() => {
                setActiveTool('eraser');
                setShowPenOptions(false);
                setShowShapesMenu(false);
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-blue-600 text-white shadow-md'
                  : inactiveBtnClass
              }`}
            >
              <Eraser size={17} />
            </button>
          </ToolbarTooltip>

          {/* Shapes tool */}
          <ToolbarTooltip label="Shapes" shortcut="S" hidden={showShapesMenu} isLight={isLight}>
            <button
              type="button"
              aria-label="Shapes tool"
              onClick={() => {
                setShowShapesMenu((prev) => !prev);
                setShowPenOptions(false);
              }}
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
                showShapesMenu || activeTool === 'shape'
                  ? 'bg-blue-600 text-white shadow-md'
                  : inactiveBtnClass
              }`}
            >
              <ShapeIcon size={17} />
              <span
                style={{ backgroundColor: shapeColor }}
                className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black shadow-xs"
              />
            </button>
          </ToolbarTooltip>

          {/* Text tool */}
          <ToolbarTooltip label="Text" isLight={isLight}>
            <button
              type="button"
              aria-label="Add Text Box"
              onClick={() => {
                setShowPenOptions(false);
                setShowShapesMenu(false);
                onAddTextBox();
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${inactiveBtnClass}`}
            >
              <FileText size={17} />
            </button>
          </ToolbarTooltip>

          {/* Image tool */}
          <ToolbarTooltip label="Image" isLight={isLight}>
            <button
              type="button"
              aria-label="Add Image"
              onClick={() => {
                setShowPenOptions(false);
                setShowShapesMenu(false);
                onOpenUploadModal('image');
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${inactiveBtnClass}`}
            >
              <ImageIcon size={17} />
            </button>
          </ToolbarTooltip>

          {/* Video tool */}
          <ToolbarTooltip label="Video" isLight={isLight}>
            <button
              type="button"
              aria-label="Add Video"
              onClick={() => {
                setShowPenOptions(false);
                setShowShapesMenu(false);
                onOpenUploadModal('video');
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${inactiveBtnClass}`}
            >
              <FileVideo size={17} />
            </button>
          </ToolbarTooltip>

          {/* Audio tool */}
          <ToolbarTooltip label="Audio" isLight={isLight}>
            <button
              type="button"
              aria-label="Add Audio Track"
              onClick={() => {
                setShowPenOptions(false);
                setShowShapesMenu(false);
                onOpenUploadModal('audio');
              }}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${inactiveBtnClass}`}
            >
              <MusicNote size={17} />
            </button>
          </ToolbarTooltip>

          <div className={`h-5 w-[1px] mx-1 ${isLight ? 'bg-black/15' : 'bg-white/15'}`} />

          {/* Undo Action (Desktop) */}
          {onUndo && (
            <ToolbarTooltip label="Undo" shortcut="Ctrl+Z" isLight={isLight}>
              <button
                type="button"
                disabled={!canUndo}
                aria-label="Undo"
                onClick={onUndo}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
                  !canUndo
                    ? 'opacity-30 cursor-not-allowed text-neutral-400'
                    : inactiveBtnClass
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              </button>
            </ToolbarTooltip>
          )}

          {/* Redo Action (Desktop) */}
          {onRedo && (
            <ToolbarTooltip label="Redo" shortcut="Ctrl+Y" isLight={isLight}>
              <button
                type="button"
                disabled={!canRedo}
                aria-label="Redo"
                onClick={onRedo}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
                  !canRedo
                    ? 'opacity-30 cursor-not-allowed text-neutral-400'
                    : inactiveBtnClass
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6" />
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                </svg>
              </button>
            </ToolbarTooltip>
          )}

          {/* Gemini AI Canvas Agent (Desktop) */}
          {onOpenAiAgent && (
            <ToolbarTooltip label="Gemini AI Agent" shortcut="Ctrl+K" isLight={isLight}>
              <button
                type="button"
                aria-label="Gemini AI Agent"
                onClick={onOpenAiAgent}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
                  isLight
                    ? 'text-blue-600 hover:bg-blue-50 font-bold'
                    : 'text-blue-400 hover:text-white hover:bg-blue-600/20 font-bold'
                }`}
              >
                <span className="text-sm">✦</span>
              </button>
            </ToolbarTooltip>
          )}

          <div className={`hidden sm:block h-5 w-[1px] mx-1 ${isLight ? 'bg-black/15' : 'bg-white/15'}`} />

          {/* Zoom Controls (Desktop) */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Zoom Out"
              onClick={onZoomOut}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
                isLight
                  ? 'text-[#2d2424] hover:text-black hover:bg-black/5'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <ZoomOut size={15} />
            </button>

            <ToolbarTooltip label="Reset View (100%)" isLight={isLight}>
              <button
                type="button"
                aria-label="Reset Zoom (100%)"
                onClick={onResetZoom}
                className={`px-2 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer min-w-[38px] text-center ${
                  isLight
                    ? 'text-[#2d2424] hover:text-black hover:bg-black/5 font-medium'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {Math.round(zoom * 100)}%
              </button>
            </ToolbarTooltip>

            <button
              type="button"
              aria-label="Zoom In"
              onClick={onZoomIn}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
                isLight
                  ? 'text-[#2d2424] hover:text-black hover:bg-black/5'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <ZoomIn size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
