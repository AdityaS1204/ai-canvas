'use client';

import React, { useState, useEffect } from 'react';
import { CloudinaryConfig } from '@/types/canvas';
import { getStoredCloudinaryConfig, saveStoredCloudinaryConfig } from '@/lib/cloudinary';
import { Close } from '@honeyicons/react';
import { motion, AnimatePresence } from 'motion/react';

interface CloudinaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (config: CloudinaryConfig) => void;
}

export default function CloudinaryConfigModal({
  isOpen: _isOpen,
  onClose,
  onSaved,
}: CloudinaryConfigModalProps) {
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const cfg = getStoredCloudinaryConfig();
    setCloudName(cfg.cloudName || '');
    setUploadPreset(cfg.uploadPreset || '');
    setApiKey(cfg.apiKey || '');
    setSavedSuccess(false);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    }, 600);
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
          transformOrigin: '62% 100%',
        }}
        className="relative w-full max-w-[480px] bg-[#161519] border border-white/10 rounded-[28px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_0_24px_rgba(255,255,255,0.02),0_24px_65px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
      >
        {/* Modal Body */}
        <div className="p-6 flex flex-col">
          {/* Header with Title and Close button */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                Cloudinary Storage
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Direct cloud media storage configuration for images and videos.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shrink-0"
            >
              <Close size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Progressive Disclosure: Setup Instructions */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_0_16px_rgba(255,255,255,0.02)] overflow-hidden transition-colors">
              <button
                type="button"
                onClick={() => setShowInstructions((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-medium text-white/90 hover:text-white transition-colors cursor-pointer select-none"
              >
                <span>Setup instructions</span>
                <span
                  className={`text-[10px] text-white/40 transition-transform duration-300 ${
                    showInstructions ? 'rotate-180 text-white' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              <AnimatePresence initial={false}>
                {showInstructions && (
                  <motion.div
                    key="cloudinary-instructions-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: 'auto',
                      opacity: 1,
                      transition: {
                        height: { type: 'spring', damping: 24, stiffness: 280, mass: 0.8 },
                        opacity: { duration: 0.22, delay: 0.05 },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
                        opacity: { duration: 0.15 },
                      },
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5 text-[11px] text-white/70 leading-relaxed">
                      {/* Step 1 */}
                      <div className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[10px] flex items-center justify-center font-semibold mt-0.5 shadow-sm">
                          1
                        </span>
                        <div>
                          <strong className="text-white">Cloud Name</strong>
                          <p className="text-white/60 mt-0.5">
                            Find your Cloud Name on your main Cloudinary Dashboard.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[10px] flex items-center justify-center font-semibold mt-0.5 shadow-sm">
                          2
                        </span>
                        <div>
                          <strong className="text-white">Unsigned Upload Preset</strong>
                          <p className="text-white/60 mt-0.5">
                            Go to <strong className="text-white/90">Settings &rarr; Upload &rarr; Upload Presets</strong>, add or edit a preset, and set Signing Mode to <strong className="text-white/95">Unsigned</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[10px] flex items-center justify-center font-semibold mt-0.5 shadow-sm">
                          3
                        </span>
                        <div>
                          <strong className="text-white">Optional Local Mode</strong>
                          <p className="text-white/60 mt-0.5">
                            Leave the preset empty to upload and play files locally without Cloudinary.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Cloud Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. my-cloudinary-cloud"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 focus:border-white/50 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),inset_0_0_1px_rgba(255,255,255,0.1)] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Unsigned Upload Preset
              </label>
              <input
                type="text"
                placeholder="e.g. canvas_unsigned_preset"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 focus:border-white/50 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),inset_0_0_1px_rgba(255,255,255,0.1)] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                API Key (Optional)
              </label>
              <input
                type="text"
                placeholder="Optional API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 focus:border-white/50 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),inset_0_0_1px_rgba(255,255,255,0.1)] font-mono"
              />
            </div>

            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs text-center font-medium">
                ✓ Configuration saved successfully!
              </div>
            )}

            {/* Bottom Footer Action Buttons - Matching Pill Design */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-6 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white font-medium text-xs transition-colors cursor-pointer text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(255,255,255,0.2)] cursor-pointer text-center"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
