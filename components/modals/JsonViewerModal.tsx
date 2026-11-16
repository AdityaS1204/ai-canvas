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
  onImportState,
}: JsonViewerModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
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
        className="relative w-full max-w-2xl bg-[#161519] border border-white/10 rounded-[28px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_0_24px_rgba(255,255,255,0.02),0_24px_65px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Top Banner: Matching Modal Header Design */}
        <div className="relative w-full h-28 overflow-hidden rounded-t-[28px] bg-gradient-to-b from-[#1c1a24] to-[#121115] flex items-center justify-center shadow-[inset_0_-1px_1px_rgba(255,255,255,0.06)]">
          <div className="w-11 h-11 rounded-2xl bg-white/[0.08] border border-white/15 text-white/90 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.4)]">
            <Download size={22} />
          </div>
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161519] via-transparent to-black/20 pointer-events-none" />

          {/* Floating subtle circular close button */}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="absolute top-3.5 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white/80 hover:text-white border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] z-10"
          >
            <Close size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 pt-3 pb-6 flex flex-col flex-1 overflow-hidden">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Canvas State & JSON
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Inspect, copy, export, or import project state.
            </p>
          </div>

          {/* Tab Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.05] rounded-full w-fit mb-4 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => setActiveTab('view')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'view'
                  ? 'bg-white text-black shadow-md'
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
                  ? 'bg-white text-black shadow-md'
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
                <div className="flex-1 overflow-auto bg-black/70 border border-white/10 rounded-2xl p-4 font-mono text-[11px] text-white/90 leading-relaxed shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),inset_0_0_1px_rgba(255,255,255,0.08)]">
                  <pre>{jsonString}</pre>
                </div>

                {/* Footer Buttons for View */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-white/40 font-mono">
                    {items.length} items • {strokes.length} strokes • {connectors.length} connectors
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="py-2.5 px-5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white/90 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]"
                    >
                      {copied ? <Check size={14} /> : null}
                      {copied ? 'Copied' : 'Copy JSON'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="py-2.5 px-5 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(255,255,255,0.2)] cursor-pointer"
                    >
                      Download File
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/80">
                    Paste JSON or choose a file:
                  </label>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileImport}
                    className="block text-xs text-white/60 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer"
                  />
                </div>

                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version": "1.0.0", "items": [...], ...}'
                  className="w-full flex-1 bg-black/70 border border-white/15 focus:border-white/50 rounded-2xl p-4 font-mono text-xs text-white placeholder-white/25 outline-none resize-none shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),inset_0_0_1px_rgba(255,255,255,0.08)]"
                />

                {importError && (
                  <p className="text-[11px] text-red-400 text-center">{importError}</p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-6 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white/80 font-medium text-xs transition-colors cursor-pointer text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!importText.trim()}
                    onClick={handleImport}
                    className="flex-1 py-3 px-6 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(255,255,255,0.2)] cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
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
