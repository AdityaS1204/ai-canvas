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
  theme?: 'dark' | 'light';
}

export default function CloudinaryConfigModal({
  isOpen: _isOpen,
  onClose,
  onSaved,
  theme = 'dark',
}: CloudinaryConfigModalProps) {
  const isLight = theme === 'light';
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
          transformOrigin: '62% 100%',
        }}
        className={`relative w-full max-w-[480px] rounded-[28px] overflow-hidden flex flex-col transition-colors border ${
          isLight
            ? 'bg-[#ffffff] border-[#ded6d6] text-[#2d2424] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_24px_65px_rgba(0,0,0,0.15)]'
            : 'bg-[#161519] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_0_24px_rgba(255,255,255,0.02),0_24px_65px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Modal Body */}
        <div className="p-6 flex flex-col">
          {/* Header with Title and Close button */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2
                className={`text-xl font-semibold tracking-tight ${
                  isLight ? 'text-[#2d2424]' : 'text-white'
                }`}
              >
                Cloudinary Storage
              </h2>
              <p className={`text-xs mt-1 ${isLight ? 'text-[#6e5d5d]' : 'text-white/50'}`}>
                Direct cloud media storage configuration for images and videos.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Progressive Disclosure: Setup Instructions */}
            <div
              className={`rounded-2xl overflow-hidden transition-colors border ${
                isLight
                  ? 'bg-black/[0.02] border-black/10 shadow-inner'
                  : 'bg-white/[0.03] border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_0_16px_rgba(255,255,255,0.02)]'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowInstructions((prev) => !prev)}
                className={`w-full px-4 py-3 flex items-center justify-between text-left text-xs font-medium transition-colors cursor-pointer select-none ${
                  isLight ? 'text-[#2d2424] hover:text-black' : 'text-white/90 hover:text-white'
                }`}
              >
                <span>Setup instructions</span>
                <span
                  className={`text-[10px] transition-transform duration-300 ${
                    showInstructions
                      ? isLight
                        ? 'rotate-180 text-black'
                        : 'rotate-180 text-white'
                      : isLight
                      ? 'text-black/40'
                      : 'text-white/40'
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
                    <div
                      className={`px-4 pb-4 pt-1 space-y-3 border-t text-[11px] leading-relaxed ${
                        isLight
                          ? 'border-black/5 text-[#5a4848]'
                          : 'border-white/5 text-white/70'
                      }`}
                    >
                      {/* Step 1 */}
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full font-mono text-[10px] flex items-center justify-center font-semibold mt-0.5 shadow-sm ${
                            isLight
                              ? 'bg-black/10 text-[#2d2424]'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          1
                        </span>
                        <div>
                          <strong className={isLight ? 'text-[#2d2424]' : 'text-white'}>
                            Cloud Name
                          </strong>
                          <p className={`mt-0.5 ${isLight ? 'text-[#6e5d5d]' : 'text-white/60'}`}>
                            Find your Cloud Name on your main Cloudinary Dashboard.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full font-mono text-[10px] flex items-center justify-center font-semibold mt-0.5 shadow-sm ${
                            isLight
                              ? 'bg-black/10 text-[#2d2424]'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          2
                        </span>
                        <div>
                          <strong className={isLight ? 'text-[#2d2424]' : 'text-white'}>
                            Unsigned Upload Preset
                          </strong>
                          <p className={`mt-0.5 ${isLight ? 'text-[#6e5d5d]' : 'text-white/60'}`}>
                            Go to{' '}
                            <strong className={isLight ? 'text-[#2d2424]' : 'text-white/90'}>
                              Settings &rarr; Upload &rarr; Upload Presets
                            </strong>
                            , add or edit a preset, and set Signing Mode to{' '}
                            <strong className={isLight ? 'text-[#2d2424]' : 'text-white/95'}>
                              Unsigned
                            </strong>
                            .
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full font-mono text-[10px] flex items-center justify-center font-semibold mt-0.5 shadow-sm ${
                            isLight
                              ? 'bg-black/10 text-[#2d2424]'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          3
                        </span>
                        <div>
                          <strong className={isLight ? 'text-[#2d2424]' : 'text-white'}>
                            Optional Local Mode
                          </strong>
                          <p className={`mt-0.5 ${isLight ? 'text-[#6e5d5d]' : 'text-white/60'}`}>
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
              <label
                className={`block text-xs font-medium mb-1.5 ${
                  isLight ? 'text-[#4a3b3b]' : 'text-white/80'
                }`}
              >
                Cloud Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. my-cloudinary-cloud"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                  isLight
                    ? 'bg-white border border-black/15 focus:border-black/40 text-[#2d2424] placeholder-black/35 shadow-sm focus:outline-none'
                    : 'bg-black/60 border border-white/15 focus:border-white/50 text-white placeholder-white/30 focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),inset_0_0_1px_rgba(255,255,255,0.1)]'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-medium mb-1.5 ${
                  isLight ? 'text-[#4a3b3b]' : 'text-white/80'
                }`}
              >
                Unsigned Upload Preset
              </label>
              <input
                type="text"
                placeholder="e.g. canvas_unsigned_preset"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                  isLight
                    ? 'bg-white border border-black/15 focus:border-black/40 text-[#2d2424] placeholder-black/35 shadow-sm focus:outline-none'
                    : 'bg-black/60 border border-white/15 focus:border-white/50 text-white placeholder-white/30 focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),inset_0_0_1px_rgba(255,255,255,0.1)]'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-medium mb-1.5 ${
                  isLight ? 'text-[#4a3b3b]' : 'text-white/80'
                }`}
              >
                API Key (Optional)
              </label>
              <input
                type="text"
                placeholder="Optional API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                  isLight
                    ? 'bg-white border border-black/15 focus:border-black/40 text-[#2d2424] placeholder-black/35 shadow-sm focus:outline-none'
                    : 'bg-black/60 border border-white/15 focus:border-white/50 text-white placeholder-white/30 focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),inset_0_0_1px_rgba(255,255,255,0.1)]'
                }`}
              />
            </div>

            {savedSuccess && (
              <div
                className={`p-2.5 rounded-xl text-xs text-center font-medium border ${
                  isLight
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                }`}
              >
                ✓ Configuration saved successfully!
              </div>
            )}

            {/* Bottom Footer Action Buttons - Matching Pill Design */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 px-6 rounded-full font-medium text-xs transition-colors cursor-pointer text-center ${
                  isLight
                    ? 'bg-black/[0.05] hover:bg-black/[0.09] text-[#2d2424] hover:text-black border border-black/5'
                    : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]'
                }`}
              >
                Close
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 px-6 rounded-full font-semibold text-xs transition-all cursor-pointer text-center ${
                  isLight
                    ? 'bg-[#2d2424] hover:bg-[#1a1515] text-white shadow-md'
                    : 'bg-white hover:bg-neutral-200 text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(255,255,255,0.2)]'
                }`}
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
