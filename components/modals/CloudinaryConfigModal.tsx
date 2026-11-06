'use client';

import React, { useState, useEffect } from 'react';
import { CloudinaryConfig } from '@/types/canvas';
import { getStoredCloudinaryConfig, saveStoredCloudinaryConfig } from '@/lib/cloudinary';
import { Close, CloudUpload } from '@honeyicons/react';

interface CloudinaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (config: CloudinaryConfig) => void;
}

export default function CloudinaryConfigModal({
  isOpen,
  onClose,
  onSaved,
}: CloudinaryConfigModalProps) {
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredCloudinaryConfig();
      setCloudName(cfg.cloudName || '');
      setUploadPreset(cfg.uploadPreset || '');
      setApiKey(cfg.apiKey || '');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: CloudinaryConfig = {
      cloudName: cloudName.trim(),
      uploadPreset: uploadPreset.trim(),
      apiKey: apiKey.trim(),
    };
    saveStoredCloudinaryConfig(newConfig);
    onSaved(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-black border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <CloudUpload size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Cloudinary Storage</h3>
              <p className="text-xs text-white/50">Media cloud storage configuration</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-xs text-white/90 leading-relaxed">
            <span className="font-semibold text-blue-400">💡 Unsigned Upload:</span> Allows uploading images,
            videos, and audios directly from your browser to Cloudinary.
            Create an unsigned preset under Cloudinary Console → Settings → Upload Presets.
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">
              Cloudinary Cloud Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. my-cloud-name"
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">
              Unsigned Upload Preset
            </label>
            <input
              type="text"
              placeholder="e.g. canvas_preset_unsigned"
              value={uploadPreset}
              onChange={(e) => setUploadPreset(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">
              API Key (Optional)
            </label>
            <input
              type="text"
              placeholder="Optional API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs text-center font-medium">
              ✓ Settings saved successfully!
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
