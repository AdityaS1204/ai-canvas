'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, CloudUpload, Layers, Trash, Close } from '@honeyicons/react';

interface SettingsDropdownProps {
  isCloudinaryConfigured: boolean;
  onOpenCloudinaryModal: () => void;
  onOpenJsonModal: () => void;
  onClearCanvas: () => void;
}

export default function SettingsDropdown({
  isCloudinaryConfigured,
  onOpenCloudinaryModal,
  onOpenJsonModal,
  onClearCanvas,
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative z-50 select-none">
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 450,
          damping: 32,
          mass: 0.8,
        }}
        className={`overflow-hidden backdrop-blur-2xl shadow-2xl border ${
          isOpen
            ? 'w-60 rounded-2xl bg-black/95 border-white/20 p-2 shadow-black/90'
            : 'w-10 h-10 rounded-2xl bg-black/90 border-white/15 hover:border-white/30 flex items-center justify-center cursor-pointer shadow-black/80'
        }`}
        onClick={() => {
          if (!isOpen) setIsOpen(true);
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isOpen ? (
            /* Closed State: Compact Settings Icon Button */
            <motion.button
              key="closed-button"
              type="button"
              initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              title="Settings & Tools"
              className="w-full h-full flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <Settings size={18} />
            </motion.button>
          ) : (
            /* Open Morphed State: Full Settings Dropdown */
            <motion.div
              key="open-menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="flex flex-col gap-1 w-full"
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <span className="text-white/60">
                    <Settings size={15} />
                  </span>
                  <span>Options</span>
                </div>
                <button
                  type="button"
                  title="Close menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Close size={13} />
                </button>
              </div>

              {/* Action 1: Cloudinary Connect */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCloudinaryModal();
                }}
                className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <CloudUpload size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Cloudinary Connect</span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCloudinaryConfigured ? 'bg-blue-500' : 'bg-white/30'
                  }`}
                  title={isCloudinaryConfigured ? 'Connected' : 'Not configured'}
                />
              </button>

              {/* Action 2: Inspect JSON */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenJsonModal();
                }}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer group text-left"
              >
                <Layers size={16} className="text-white group-hover:scale-110 transition-transform" />
                <span className="font-medium">Inspect JSON</span>
              </button>

              <div className="h-[1px] bg-white/10 my-0.5 mx-1" />

              {/* Action 3: Clear / Delete Canvas */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onClearCanvas();
                }}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer group text-left"
              >
                <Trash size={16} className="text-white/60 group-hover:text-white group-hover:scale-110 transition-transform" />
                <span className="font-medium">Clear Canvas</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

