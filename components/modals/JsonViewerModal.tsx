'use client';

import React, { useState } from 'react';
import { CanvasItem, CanvasConnector, CanvasState, DrawingStroke, ViewportTransform } from '@/types/canvas';
import { exportCanvasToJson, downloadJsonFile } from '@/lib/storage';
import { Close, Download } from '@honeyicons/react';

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CanvasItem[];
  connectors?: CanvasConnector[];
  strokes: DrawingStroke[];
  viewport: ViewportTransform;
  onImportState: (state: CanvasState) => void;
}

export default function JsonViewerModal({
  isOpen,
  onClose,
  items,
  connectors = [],
  strokes,
  viewport,
  onImportState,
}: JsonViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'view' | 'import'>('view');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const jsonString = exportCanvasToJson(items, strokes, viewport, connectors);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadJsonFile(jsonString, `canvas-state-${Date.now()}.json`);
  };

  const handleImport = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed.items)) {
        throw new Error('Invalid JSON: missing "items" array.');
      }
      onImportState({
        version: parsed.version || '1.0.0',
        items: parsed.items,
        strokes: parsed.strokes || [],
        viewport: parsed.viewport || { x: 0, y: 0, scale: 1 },
        lastUpdated: Date.now(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-black border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <Download size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Canvas JSON State</h3>
              <p className="text-xs text-white/50">
                Positions, Cloudinary media URLs, and items in structured JSON
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Close size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 px-6 pt-3 gap-4 text-xs font-medium bg-black">
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className={`pb-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'view'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Current State ({items.length} items)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Import JSON
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-hidden flex-1 flex flex-col">
          {activeTab === 'view' ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-auto bg-black border border-white/15 rounded-2xl p-4 font-mono text-[11px] text-white/90 leading-relaxed selection:bg-blue-600 selection:text-white">
                <pre>{jsonString}</pre>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2">
                <span className="text-xs text-white/40 font-mono">
                  {items.length} items • {strokes.length} drawing strokes
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    {copied ? '✓ Copied' : 'Copy JSON'}
                  </button>
                  <button
                    type="submit"
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Download JSON File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-2">
                  Paste Canvas JSON or upload a .json file:
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="block text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer"
                />
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"version": "1.0.0", "items": [...], ...}'
                className="w-full flex-1 bg-black border border-white/20 rounded-2xl p-4 font-mono text-xs text-white outline-none focus:border-blue-500 resize-none"
              />

              {importError && (
                <div className="p-3 bg-white/5 border border-white/20 rounded-xl text-white text-xs">
                  {importError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importText.trim()}
                  onClick={handleImport}
                  className="px-5 py-2 bg-blue-600 disabled:opacity-50 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Load into Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
