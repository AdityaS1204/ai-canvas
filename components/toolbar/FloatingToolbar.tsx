'use client';

import React, { useState } from 'react';
import { ActiveTool } from '@/types/canvas';
import {
  Pen,
  FileText,
  Image as ImageIcon,
  FileVideo,
  MusicNote,
  Pointer,
  ZoomIn,
  ZoomOut,
  Download,
  CloudUpload,
  Trash,
} from '@honeyicons/react';

interface FloatingToolbarProps {
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
  children: React.ReactNode;
}

function ToolbarTooltip({ label, shortcut, hidden = false, children }: ToolbarTooltipProps) {
  return (
    <div className="relative group/tooltip flex items-center justify-center">
      {children}
      {!hidden && (
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#281f1f] border border-[#524141] text-[11px] font-medium text-white/95 shadow-xl opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-150 z-50 whitespace-nowrap">
          <span>{label}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-white/70 font-mono leading-none">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}

export default function FloatingToolbar({
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
  onClearCanvas,
}: FloatingToolbarProps) {
  const [showPenOptions, setShowPenOptions] = useState(false);

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 select-none pointer-events-auto">
      {/* Pen Options Popup (only blue, white, black) */}
      {showPenOptions && activeTool === 'pen' && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-[#241c1c]/95 backdrop-blur-xl border border-[#524141] shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
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

          <div className="h-4 w-[1px] bg-white/20" />

          {/* Pen widths */}
          <div className="flex items-center gap-2 text-xs text-white/70">
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setPenWidth(w)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  penWidth === w ? 'bg-blue-600 text-white font-medium' : 'hover:text-white'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Floating Toolbar - perfectly fitted inside frame notch */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#231b1b] border border-[#524141] shadow-xl shadow-black/80">
        {/* Selection / Move tool */}
        <ToolbarTooltip label="Select" shortcut="V">
          <button
            type="button"
            aria-label="Select tool"
            onClick={() => {
              setActiveTool('select');
              setShowPenOptions(false);
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Pointer size={18} />
          </button>
        </ToolbarTooltip>

        {/* Pen tool */}
        <ToolbarTooltip label="Draw / Pen" shortcut="P" hidden={showPenOptions && activeTool === 'pen'}>
          <button
            type="button"
            aria-label="Pen tool"
            onClick={() => {
              setActiveTool('pen');
              setShowPenOptions(!showPenOptions || activeTool !== 'pen');
            }}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
              activeTool === 'pen'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Pen size={18} />
            <span
              style={{ backgroundColor: penColor }}
              className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black"
            />
          </button>
        </ToolbarTooltip>

        {/* Text tool - Clicking immediately opens a new text box on canvas */}
        <ToolbarTooltip label="Text">
          <button
            type="button"
            aria-label="Add Text Box"
            onClick={() => {
              setShowPenOptions(false);
              onAddTextBox();
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <FileText size={18} />
          </button>
        </ToolbarTooltip>

        {/* Image tool */}
        <ToolbarTooltip label="Image">
          <button
            type="button"
            aria-label="Add Image"
            onClick={() => {
              setShowPenOptions(false);
              onOpenUploadModal('image');
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <ImageIcon size={18} />
          </button>
        </ToolbarTooltip>

        {/* Video tool */}
        <ToolbarTooltip label="Video">
          <button
            type="button"
            aria-label="Add Video"
            onClick={() => {
              setShowPenOptions(false);
              onOpenUploadModal('video');
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <FileVideo size={18} />
          </button>
        </ToolbarTooltip>

        {/* Audio tool */}
        <ToolbarTooltip label="Audio">
          <button
            type="button"
            aria-label="Add Audio Track"
            onClick={() => {
              setShowPenOptions(false);
              onOpenUploadModal('audio');
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <MusicNote size={18} />
          </button>
        </ToolbarTooltip>

        <div className="h-5 w-[1px] bg-white/15 mx-0.5" />

        {/* Cloudinary Storage Config */}
        <ToolbarTooltip label="Cloudinary">
          <button
            type="button"
            aria-label="Cloudinary Storage Settings"
            onClick={onOpenCloudinaryModal}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-blue-400 hover:text-white hover:bg-blue-600/20 transition-all cursor-pointer"
          >
            <CloudUpload size={18} />
          </button>
        </ToolbarTooltip>

        {/* JSON Inspector & Export */}
        <ToolbarTooltip label="Inspect JSON">
          <button
            type="button"
            aria-label="View & Export Canvas JSON"
            onClick={onOpenJsonModal}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <Download size={18} />
          </button>
        </ToolbarTooltip>

        <div className="h-5 w-[1px] bg-white/15 mx-0.5" />

        {/* Zoom Controls (Zoom Out & Zoom In have NO tooltip as requested) */}
        <button
          type="button"
          aria-label="Zoom Out"
          onClick={onZoomOut}
          className="flex items-center justify-center w-7.5 h-7.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <ZoomOut size={15} />
        </button>

        <ToolbarTooltip label="Reset View (100%)">
          <button
            type="button"
            aria-label="Reset Zoom (100%)"
            onClick={onResetZoom}
            className="px-1.5 py-0.5 text-[11px] font-mono text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer min-w-[38px] text-center"
          >
            {Math.round(zoom * 100)}%
          </button>
        </ToolbarTooltip>

        <button
          type="button"
          aria-label="Zoom In"
          onClick={onZoomIn}
          className="flex items-center justify-center w-7.5 h-7.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <ZoomIn size={15} />
        </button>
      </div>
    </div>
  );
}
