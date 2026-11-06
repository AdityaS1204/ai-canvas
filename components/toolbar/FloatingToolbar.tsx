'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ActiveTool } from '@/types/canvas';
import {
  Pen,
  Eraser,
  FileText,
  Image as ImageIcon,
  FileVideo,
  MusicNote,
  Pointer,
  ZoomIn,
  ZoomOut,
  Download,
  CloudUpload,
} from '@honeyicons/react';

interface FloatingToolbarProps {
  theme?: 'dark' | 'light';
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penWidth: number;
  setPenWidth: (w: number) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onAddTextBox: () => void;
  onOpenUploadModal: (type: 'image' | 'video' | 'audio') => void;
  onOpenJsonModal: () => void;
  onOpenCloudinaryModal: () => void;
  onClearCanvas: () => void;
  onDimensionsChange?: (dims: { width: number; height: number }) => void;
}

// Strictly restricted to Blue, White, and Black palette
const PEN_COLORS = [
  '#2563eb', // Royal Blue
  '#60a5fa', // Light Blue
  '#1d4ed8', // Dark Blue
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

export default function FloatingToolbar({
  theme = 'dark',
  activeTool,
  setActiveTool,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onAddTextBox,
  onOpenUploadModal,
  onOpenJsonModal,
  onOpenCloudinaryModal,
  onDimensionsChange,
}: FloatingToolbarProps) {
  const [showPenOptions, setShowPenOptions] = useState(false);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

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
    ? 'text-[#5a4848] hover:text-[#18181b] hover:bg-black/5'
    : 'text-white/60 hover:text-white hover:bg-white/10';

  return (
    <div className="fixed bottom-1.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 select-none pointer-events-auto">
      {/* Pen Options Popup */}
      {showPenOptions && activeTool === 'pen' && (
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-md backdrop-blur-xl border shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isLight
              ? 'bg-[#ffffff]/95 border-[#d8cfcf] text-[#2d2424]'
              : 'bg-[#241c1c]/95 border-[#524141] text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPenColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-white/30 ${
                  penColor === c ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105 opacity-80'
                }`}
              />
            ))}
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

      {/* Main Floating Toolbar - perfectly centered on screen */}
      <div
        ref={toolbarContainerRef}
        className={`flex items-center gap-1 p-1.5 rounded-md border shadow-xl transition-colors duration-200 ${
          isLight
            ? 'bg-[#ffffff] border-[#d8cfcf] shadow-black/10'
            : 'bg-[#231b1b] border-[#524141] shadow-black/80'
        }`}
      >
        {/* Selection / Move tool */}
        <ToolbarTooltip label="Select" shortcut="V" isLight={isLight}>
          <button
            type="button"
            aria-label="Select tool"
            onClick={() => {
              setActiveTool('select');
              setShowPenOptions(false);
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-md'
                : inactiveBtnClass
            }`}
          >
            <Pointer size={17} />
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
              setShowPenOptions(!showPenOptions || activeTool !== 'pen');
            }}
            className={`relative flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${
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
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-blue-600 text-white shadow-md'
                : inactiveBtnClass
            }`}
          >
            <Eraser size={17} />
          </button>
        </ToolbarTooltip>

        {/* Shapes tool */}
        <ToolbarTooltip label="Shapes" shortcut="S" isLight={isLight}>
          <button
            type="button"
            aria-label="Shapes tool"
            onClick={() => {
              setActiveTool('shape');
              setShowPenOptions(false);
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${
              activeTool === 'shape'
                ? 'bg-blue-600 text-white shadow-md'
                : inactiveBtnClass
            }`}
          >
            <ShapeIcon size={17} />
          </button>
        </ToolbarTooltip>

        {/* Text tool - Clicking immediately opens a new text box on canvas */}
        <ToolbarTooltip label="Text" isLight={isLight}>
          <button
            type="button"
            aria-label="Add Text Box"
            onClick={() => {
              setShowPenOptions(false);
              onAddTextBox();
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${inactiveBtnClass}`}
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
              onOpenUploadModal('image');
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${inactiveBtnClass}`}
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
              onOpenUploadModal('video');
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${inactiveBtnClass}`}
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
              onOpenUploadModal('audio');
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${inactiveBtnClass}`}
          >
            <MusicNote size={17} />
          </button>
        </ToolbarTooltip>

        <div className={`h-5 w-[1px] mx-1 ${isLight ? 'bg-black/15' : 'bg-white/15'}`} />

        {/* Cloudinary Storage Config */}
        <ToolbarTooltip label="Cloudinary" isLight={isLight}>
          <button
            type="button"
            aria-label="Cloudinary Storage Settings"
            onClick={onOpenCloudinaryModal}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${
              isLight
                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                : 'text-blue-400 hover:text-white hover:bg-blue-600/20'
            }`}
          >
            <CloudUpload size={17} />
          </button>
        </ToolbarTooltip>

        {/* JSON Inspector & Export */}
        <ToolbarTooltip label="Inspect JSON" isLight={isLight}>
          <button
            type="button"
            aria-label="View & Export Canvas JSON"
            onClick={onOpenJsonModal}
            className={`flex items-center justify-center w-9 h-9 rounded-md transition-all cursor-pointer ${
              isLight
                ? 'text-[#5a4848] hover:text-[#18181b] hover:bg-black/5'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Download size={17} />
          </button>
        </ToolbarTooltip>

        <div className={`h-5 w-[1px] mx-1 ${isLight ? 'bg-black/15' : 'bg-white/15'}`} />

        {/* Zoom Controls */}
        <button
          type="button"
          aria-label="Zoom Out"
          onClick={onZoomOut}
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-all cursor-pointer ${
            isLight
              ? 'text-[#5a4848] hover:text-[#18181b] hover:bg-black/5'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <ZoomOut size={15} />
        </button>

        <ToolbarTooltip label="Reset View (100%)" isLight={isLight}>
          <button
            type="button"
            aria-label="Reset Zoom (100%)"
            onClick={onResetZoom}
            className={`px-2 py-1 text-[11px] font-mono rounded-md transition-all cursor-pointer min-w-[38px] text-center ${
              isLight
                ? 'text-[#382d2d] hover:text-[#18181b] hover:bg-black/5'
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
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-all cursor-pointer ${
            isLight
              ? 'text-[#5a4848] hover:text-[#18181b] hover:bg-black/5'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <ZoomIn size={15} />
        </button>
      </div>
    </div>
  );
}
