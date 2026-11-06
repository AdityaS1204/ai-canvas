'use client';

import React, { useState, useEffect } from 'react';
import { Trash, Close } from '@honeyicons/react';
import { SlideToConfirm } from '@/components/ui/slide-to-confirm';

interface ClearCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => void;
  theme?: 'dark' | 'light';
}

export default function ClearCanvasModal({
  isOpen,
  onClose,
  onConfirmClear,
  theme = 'dark',
}: ClearCanvasModalProps) {
  const [isClearing, setIsClearing] = useState(false);
  const isLight = theme === 'light';

  useEffect(() => {
    if (isOpen) {
      setIsClearing(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsClearing(true);
    // Smooth brief delay to display confirmed state before closing
    await new Promise((resolve) => setTimeout(resolve, 450));
    onConfirmClear();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-2xl border shadow-2xl p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200 transition-colors ${
          isLight
            ? 'bg-[#ffffff] border-[#ded6d6] text-[#2d2424]'
            : 'bg-[#241c1c] border-[#524141] text-white'
        }`}
      >
        {/* Top bar with Icon and Close button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/15 text-red-400'
              }`}
            >
              <Trash  variant="bold" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Clear Canvas</h3>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isLight
                ? 'text-black/50 hover:text-black hover:bg-black/5'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Close size={16} />
          </button>
        </div>

        {/* Warning text */}
        <p
          className={`text-xs leading-relaxed ${
            isLight ? 'text-[#5a4848]' : 'text-white/70'
          }`}
        >
          Are you sure you want to clear the canvas? All items, media, and drawings
          will be removed. This cannot be undone.
        </p>

        {/* Slide To Confirm Slider */}
        <div className="pt-1">
          <SlideToConfirm
            text="Slide to clear canvas"
            confirmedText="Cleared Canvas"
            theme={theme}
            variant="destructive"
            onConfirm={handleConfirm}
          />
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isClearing}
          className={`w-full py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
            isLight
              ? 'text-[#7a6b6b] hover:text-[#2d2424] hover:bg-black/5'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

