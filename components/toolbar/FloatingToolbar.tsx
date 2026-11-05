'use client';

import React, { useState } from 'react';
import { ActiveTool } from '@/types/canvas';
import {
  Pen,
  FileText,
  Image as ImageIcon,
  FileVideo,
  MusicNote,
  Cursor,
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
    <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 select-none pointer-events-auto">
      {/* Pen Options Popup (only blue, white, black) */}
      {showPenOptions && activeTool === 'pen' && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-black/95 backdrop-blur-xl border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
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

      {/* Main Floating Toolbar */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/90">
        {/* Selection / Move tool */}
        <button
          type="button"
          title="Select / Move"
          onClick={() => {
            setActiveTool('select');
            setShowPenOptions(false);
          }}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer ${
            activeTool === 'select'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Cursor size={20} />
        </button>

        {/* Pen tool */}
        <button
          type="button"
          title="Pen Tool"
          onClick={() => {
            setActiveTool('pen');
            setShowPenOptions(!showPenOptions || activeTool !== 'pen');
          }}
          className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer ${
            activeTool === 'pen'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Pen size={20} />
          <span
            style={{ backgroundColor: penColor }}
            className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black"
          />
        </button>

        {/* Text tool - Clicking immediately opens a new text box on canvas */}
        <button
          type="button"
          title="Add Text Box"
          onClick={() => {
            setShowPenOptions(false);
            onAddTextBox();
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <FileText size={20} />
        </button>

        {/* Image tool */}
        <button
          type="button"
          title="Add Image"
          onClick={() => {
            setShowPenOptions(false);
            onOpenUploadModal('image');
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <ImageIcon size={20} />
        </button>

        {/* Video tool */}
        <button
          type="button"
          title="Add Video"
          onClick={() => {
            setShowPenOptions(false);
            onOpenUploadModal('video');
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <FileVideo size={20} />
        </button>

        {/* Audio tool */}
        <button
          type="button"
          title="Add Audio Track"
          onClick={() => {
            setShowPenOptions(false);
            onOpenUploadModal('audio');
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <MusicNote size={20} />
        </button>

        <div className="h-6 w-[1px] bg-white/15 mx-1" />

        {/* Cloudinary Storage Config */}
        <button
          type="button"
          title="Cloudinary Storage Settings"
          onClick={onOpenCloudinaryModal}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-blue-400 hover:text-white hover:bg-blue-600/20 transition-all cursor-pointer"
        >
          <CloudUpload size={20} />
        </button>

        {/* JSON Inspector & Export */}
        <button
          type="button"
          title="View & Export Canvas JSON"
          onClick={onOpenJsonModal}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <Download size={20} />
        </button>

        <div className="h-6 w-[1px] bg-white/15 mx-1" />

        {/* Zoom Controls */}
        <button
          type="button"
          title="Zoom Out"
          onClick={onZoomOut}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <ZoomOut size={16} />
        </button>

        <button
          type="button"
          title="Reset Zoom (100%)"
          onClick={onResetZoom}
          className="px-2 py-1 text-[11px] font-mono text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer min-w-[42px] text-center"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          title="Zoom In"
          onClick={onZoomIn}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <ZoomIn size={16} />
        </button>
      </div>
    </div>
  );
}
