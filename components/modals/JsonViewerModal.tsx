'use client';

import React, { useState, useEffect } from 'react';
import { CanvasItem, CanvasConnector, DrawingStroke } from '@/types/canvas';
import { Close, Download, FileText, Check } from '@honeyicons/react';
import { motion } from 'motion/react';

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CanvasItem[];
  strokes?: DrawingStroke[];
  connectors?: CanvasConnector[];
  viewport?: { x: number; y: number; scale: number };
  theme?: 'dark' | 'light';
  onImportState: (state: {
    items: CanvasItem[];
    strokes?: DrawingStroke[];
    connectors?: CanvasConnector[];
    viewport?: { x: number; y: number; scale: number };
  }) => void;
}

export default function JsonViewerModal({
  isOpen: _isOpen,
  onClose,
  items,
  strokes = [],
  connectors = [],
  viewport,
  theme = 'dark',
  onImportState,
}: JsonViewerModalProps) {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'view' | 'import'>('view');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const canvasState = {
    version: '1.0.0',
    exportTimestamp: new Date().toISOString(),
    viewport,
    itemCount: items.length,
    strokeCount: strokes.length,
    connectorCount: connectors.length,
    items,
    strokes,
    connectors,
  };

  const jsonString = JSON.stringify(canvasState, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-canvas-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (!parsed || !Array.isArray(parsed.items)) {
        throw new Error('Invalid canvas JSON: "items" array is required');
      }
      onImportState({
        items: parsed.items,
        strokes: parsed.strokes || [],
        connectors: parsed.connectors || [],
        viewport: parsed.viewport || { x: 0, y: 0, scale: 1 },
      });
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportText(text);
      } catch (err: any) {
        setImportError('Failed to read file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-colors ${
        isLight ? 'bg-black/35' : 'bg-black/80'
      }`}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.18,
          y: 320,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.14,
          y: 360,
          transition: {
            duration: 0.45,
            ease: [0.32, 0.72, 0, 1],
            opacity: { duration: 0.42, ease: 'easeInOut' },
          },
        }}
        transition={{
          type: 'spring',
          damping: 26,
          stiffness: 310,
          mass: 0.8,
        }}
        style={{
          transformOrigin: '67% 100%',
        }}
        className={`relative w-full max-w-2xl rounded-[28px] overflow-hidden flex flex-col max-h-[88vh] transition-colors border ${
          isLight
            ? 'bg-[#ffffff] border-[#ded6d6] text-[#2d2424] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_24px_65px_rgba(0,0,0,0.15)]'
            : 'bg-[#161519] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_0_24px_rgba(255,255,255,0.02),0_24px_65px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Modal Body */}
        <div className="p-6 flex flex-col flex-1 overflow-hidden">
          {/* Header with Title and Close button */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2
                className={`text-xl font-semibold tracking-tight ${
                  isLight ? 'text-[#2d2424]' : 'text-white'
                }`}
              >
                Canvas State & JSON
              </h2>
              <p className={`text-xs mt-1 ${isLight ? 'text-[#6e5d5d]' : 'text-white/50'}`}>
                Inspect, copy, export, or import project state.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                isLight
                  ? 'bg-black/[0.05] hover:bg-black/[0.1] text-black/70 hover:text-black border-black/10'
                  : 'bg-white/[0.06] hover:bg-white/[0.14] text-white/80 hover:text-white border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
              }`}
            >
              <Close size={14} />
            </button>
          </div>

          {/* Tab Selector Pills */}
          <div
            className={`flex items-center gap-1.5 p-1 rounded-full w-fit mb-4 border transition-colors ${
              isLight
                ? 'bg-black/[0.04] border-black/5 shadow-inner'
                : 'bg-white/[0.05] border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab('view')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'view'
                  ? isLight
                    ? 'bg-[#2d2424] text-white shadow-sm'
                    : 'bg-white text-black shadow-md'
                  : isLight
                  ? 'text-black/60 hover:text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <FileText size={14} />
              Current State ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? isLight
                    ? 'bg-[#2d2424] text-white shadow-sm'
                    : 'bg-white text-black shadow-md'
                  : isLight
                  ? 'text-black/60 hover:text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Download size={14} />
              Import JSON
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'view' ? (
              <div className="flex flex-col flex-1 overflow-hidden space-y-4">
                <div
                  className={`flex-1 overflow-auto rounded-2xl p-4 font-mono text-[11px] leading-relaxed border ${
                    isLight
                      ? 'bg-[#fbf9f9] border-black/10 text-[#2d2424] shadow-inner'
                      : 'bg-black/70 border-white/10 text-white/90 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),inset_0_0_1px_rgba(255,255,255,0.08)]'
                  }`}
                >
                  <pre>{jsonString}</pre>
                </div>

                {/* Footer Buttons for View */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span
                    className={`text-[11px] font-mono ${
                      isLight ? 'text-[#7a6b6b]' : 'text-white/40'
                    }`}
                  >
                    {items.length} items • {strokes.length} strokes • {connectors.length} connectors
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`py-2.5 px-5 rounded-full font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isLight
                          ? 'bg-black/[0.05] hover:bg-black/[0.1] text-[#2d2424] border border-black/5'
                          : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                      }`}
                    >
                      {copied ? <Check size={14} /> : null}
                      {copied ? 'Copied' : 'Copy JSON'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className={`py-2.5 px-5 rounded-full font-semibold text-xs transition-all cursor-pointer ${
                        isLight
                          ? 'bg-[#2d2424] hover:bg-[#1a1515] text-white shadow-md'
                          : 'bg-white hover:bg-neutral-200 text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(255,255,255,0.2)]'
                      }`}
                    >
                      Download File
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    className={`text-xs font-medium ${
                      isLight ? 'text-[#382d2d]' : 'text-white/80'
                    }`}
                  >
                    Paste JSON or choose a file:
                  </label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileImport}
                    className={`block text-xs file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-medium file:cursor-pointer ${
                      isLight
                        ? 'text-black/60 file:bg-black/5 file:text-[#2d2424] hover:file:bg-black/10'
                        : 'text-white/60 file:bg-white/10 file:text-white hover:file:bg-white/20'
                    }`}
                  />
                </div>

                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version": "1.0.0", "items": [...], ...}'
                  className={`w-full flex-1 rounded-2xl p-4 font-mono text-xs outline-none resize-none transition-colors border ${
                    isLight
                      ? 'bg-[#fbf9f9] border-black/15 focus:border-black/40 text-[#2d2424] placeholder-black/30 shadow-inner'
                      : 'bg-black/70 border-white/15 focus:border-white/50 text-white placeholder-white/25 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),inset_0_0_1px_rgba(255,255,255,0.08)]'
                  }`}
                />

                {importError && (
                  <p className="text-[11px] text-red-500 dark:text-red-400 text-center">{importError}</p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 py-3 px-6 rounded-full font-medium text-xs transition-colors cursor-pointer text-center ${
                      isLight
                        ? 'bg-black/[0.05] hover:bg-black/[0.09] text-[#2d2424] hover:text-black border border-black/5'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!importText.trim()}
                    onClick={handleImport}
                    className={`flex-1 py-3 px-6 rounded-full font-semibold text-xs transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                      isLight
                        ? 'bg-[#2d2424] hover:bg-[#1a1515] text-white shadow-md'
                        : 'bg-white hover:bg-neutral-200 text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(255,255,255,0.2)]'
                    }`}
                  >
                    Load into Canvas
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
