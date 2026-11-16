'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ItemType, StorageMeta } from '@/types/canvas';
import {
  getStoredCloudinaryConfig,
  uploadToCloudinary,
  SAMPLE_CLOUDINARY_MEDIA,
} from '@/lib/cloudinary';
import { parseVideoUrl } from '@/lib/video-parser';
import { Close, CloudUpload, Link as LinkIcon, Image as ImageIcon } from '@honeyicons/react';
import { motion } from 'motion/react';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'image' | 'video' | 'audio';
  theme?: 'dark' | 'light';
  onAddMedia: (data: {
    type: ItemType;
    url: string;
    title: string;
    width: number;
    height: number;
    storageMeta?: StorageMeta;
  }) => void;
  onOpenCloudinaryConfig: () => void;
}

// 15-bar waveform structure based on user reference image
const AUDIO_WAVEFORM_BARS = [
  { height: 6, duration: '1.4s', delay: '0.1s' },
  { height: 14, duration: '1.2s', delay: '0.35s' },
  { height: 10, duration: '1.5s', delay: '0.2s' },
  { height: 22, duration: '1.3s', delay: '0.5s' },
  { height: 22, duration: '1.6s', delay: '0.15s' },
  { height: 22, duration: '1.4s', delay: '0.4s' },
  { height: 12, duration: '1.5s', delay: '0.6s' },
  { height: 12, duration: '1.2s', delay: '0.25s' },
  { height: 22, duration: '1.5s', delay: '0.45s' },
  { height: 22, duration: '1.3s', delay: '0.2s' },
  { height: 26, duration: '1.6s', delay: '0.55s' },
  { height: 14, duration: '1.4s', delay: '0.3s' },
  { height: 16, duration: '1.5s', delay: '0.65s' },
  { height: 8, duration: '1.2s', delay: '0.15s' },
  { height: 6, duration: '1.4s', delay: '0.4s' },
];

export default function MediaUploadModal({
  isOpen: _isOpen,
  onClose,
  mediaType,
  theme = 'dark',
  onAddMedia,
  onOpenCloudinaryConfig,
}: MediaUploadModalProps) {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = getStoredCloudinaryConfig();

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Cinematic Banner Images for Image & Video
  const bannerImages = {
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop', // Golden hour wheat field with warm sunset lighting
    video:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop', // 35mm cinematic anamorphic camera lens
  };

  const samples =
    mediaType === 'image'
      ? SAMPLE_CLOUDINARY_MEDIA.images
      : mediaType === 'video'
      ? SAMPLE_CLOUDINARY_MEDIA.videos
      : SAMPLE_CLOUDINARY_MEDIA.audios;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const executeUpload = async (fileToUpload: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const result = await uploadToCloudinary(fileToUpload, config, (percent) => {
        setUploadProgress(percent);
      });

      const defaultDims =
        mediaType === 'image'
          ? { width: 420, height: 280 }
          : mediaType === 'video'
          ? { width: 440, height: 280 }
          : { width: 360, height: 160 };

      onAddMedia({
        type: mediaType,
        url: result.url,
        title: result.title || `${mediaType.toUpperCase()} Asset`,
        width: result.storageMeta.width ? Math.min(result.storageMeta.width, 500) : defaultDims.width,
        height: result.storageMeta.height ? Math.min(result.storageMeta.height, 350) : defaultDims.height,
        storageMeta: result.storageMeta,
      });

      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAsLocal = () => {
    if (!selectedFile) return;
    const localUrl = URL.createObjectURL(selectedFile);
    const defaultDims =
      mediaType === 'image'
        ? { width: 420, height: 280 }
        : mediaType === 'video'
        ? { width: 440, height: 280 }
        : { width: 360, height: 160 };

    onAddMedia({
      type: mediaType,
      url: localUrl,
      title: selectedFile.name,
      width: defaultDims.width,
      height: defaultDims.height,
      storageMeta: {
        provider: 'local',
        format: selectedFile.type.split('/')[1] || 'media',
        bytes: selectedFile.size,
        secureUrl: localUrl,
      },
    });
    onClose();
  };

  const handleAddPreset = (sample = samples[selectedPresetIndex]) => {
    if (!sample) return;
    const defaultDims =
      mediaType === 'image'
        ? { width: 420, height: 280 }
        : mediaType === 'video'
        ? { width: 440, height: 280 }
        : { width: 360, height: 160 };

    onAddMedia({
      type: mediaType,
      url: sample.url,
      title: sample.title,
      width: defaultDims.width,
      height: defaultDims.height,
      storageMeta: sample.storageMeta,
    });
    onClose();
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedUrl = customUrl.trim();
    if (!trimmedUrl) return;

    const defaultDims =
      mediaType === 'image'
        ? { width: 420, height: 280 }
        : mediaType === 'video'
        ? { width: 440, height: 280 }
        : { width: 360, height: 160 };

    let defaultTitle = '';
    const provider: 'cloudinary' | 'external' = trimmedUrl.includes('cloudinary') ? 'cloudinary' : 'external';

    if (mediaType === 'video') {
      const parsed = parseVideoUrl(trimmedUrl);
      defaultTitle = parsed.titleFallback;
    } else {
      defaultTitle = `${mediaType.toUpperCase()} Link`;
    }

    onAddMedia({
      type: mediaType,
      url: trimmedUrl,
      title: defaultTitle,
      width: defaultDims.width,
      height: defaultDims.height,
      storageMeta: {
        provider,
        secureUrl: trimmedUrl,
      },
    });
    onClose();
  };

  // Primary action button handler
  const handlePrimaryAction = () => {
    if (activeTab === 'upload') {
      if (selectedFile) {
        executeUpload(selectedFile);
      } else {
        fileInputRef.current?.click();
      }
    } else if (activeTab === 'presets') {
      handleAddPreset();
    } else if (activeTab === 'url') {
      handleAddUrl();
    }
  };

  const primaryButtonLabel = () => {
    if (isUploading) return `Uploading (${uploadProgress}%)`;
    if (activeTab === 'upload') {
      return selectedFile ? `Upload ${selectedFile.name.slice(0, 15)}...` : `Select ${mediaType}`;
    }
    if (activeTab === 'presets') {
      return 'Add to Canvas';
    }
    return 'Add Link';
  };

  // Horizontal origin corresponding to each button on the center-bottom toolbar
  const originX =
    mediaType === 'image' ? '48%' : mediaType === 'video' ? '52%' : '56%';

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
      <style>{`
        @keyframes audioWaveformPulse {
          0% {
            transform: scaleY(0.45);
            opacity: 0.85;
          }
          50% {
            transform: scaleY(1.2);
            opacity: 1;
          }
          100% {
            transform: scaleY(0.65);
            opacity: 0.9;
          }
        }
      `}</style>
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
          transformOrigin: `${originX} 100%`,
        }}
        className={`relative w-full max-w-[520px] rounded-[28px] overflow-hidden flex flex-col transition-colors border ${
          isLight
            ? 'bg-[#ffffff] border-[#ded6d6] text-[#2d2424] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_24px_65px_rgba(0,0,0,0.15)]'
            : 'bg-[#161519] border-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),inset_0_0_24px_rgba(255,255,255,0.02),0_24px_65px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Upper Section: Audio Waveform for audio (compact height h-28); Cinematic Banner Image for image/video (h-44) */}
        <div
          className={`relative w-full ${
            mediaType === 'audio' ? 'h-28' : 'h-44'
          } overflow-hidden rounded-t-[28px] flex items-center justify-center transition-colors ${
            isLight
              ? 'bg-[#f0ebeb] shadow-[inset_0_-1px_1px_rgba(0,0,0,0.06)]'
              : 'bg-black shadow-[inset_0_-1px_1px_rgba(255,255,255,0.06)]'
          }`}
        >
          {mediaType === 'audio' ? (
            /* Smoothly animating centered audio waveform matching reference image with compact height */
            <div
              className={`w-full h-full flex items-center justify-center select-none pointer-events-none ${
                isLight ? 'bg-[#f0ebeb]' : 'bg-black'
              }`}
            >
              <div className="flex items-center gap-[5px] px-8">
                {AUDIO_WAVEFORM_BARS.map((bar, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${bar.height}px`,
                      animation: `audioWaveformPulse ${bar.duration} ease-in-out infinite alternate`,
                      animationDelay: bar.delay,
                      transformOrigin: 'center',
                    }}
                    className={`w-[3.5px] rounded-full transition-transform ${
                      isLight ? 'bg-[#2d2424]' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Cinematic lighting banner image for image / video */
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImages[mediaType]}
                alt={`${mediaType} Banner`}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              {/* Gradient fade to seamlessly blend with container */}
              <div
                className={`absolute inset-0 ${
                  isLight
                    ? 'bg-gradient-to-t from-[#ffffff] via-[#ffffff]/20 to-transparent'
                    : 'bg-gradient-to-t from-[#161519] via-[#161519]/25 to-black/20'
                }`}
              />
            </>
          )}

          {/* Floating subtle circular close button */}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className={`absolute top-3.5 right-4 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer z-10 ${
              isLight
                ? 'bg-white/80 hover:bg-white text-black/70 hover:text-black border border-black/10 shadow-sm'
                : 'bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
            }`}
          >
            <Close size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 pt-3 pb-6 flex flex-col">
          {/* Header text - minimal and clean */}
          <div className="mb-4">
            <h2
              className={`text-xl font-semibold tracking-tight capitalize ${
                isLight ? 'text-[#2d2424]' : 'text-white'
              }`}
            >
              Upload {mediaType}
            </h2>
            <p className={`text-xs mt-1 ${isLight ? 'text-[#6e5d5d]' : 'text-white/50'}`}>
              Select a file, choose a preset, or paste a link.
            </p>
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
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? isLight
                    ? 'bg-[#2d2424] text-white shadow-sm'
                    : 'bg-white text-black shadow-md'
                  : isLight
                  ? 'text-black/60 hover:text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <CloudUpload size={14} />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'presets'
                  ? isLight
                    ? 'bg-[#2d2424] text-white shadow-sm'
                    : 'bg-white text-black shadow-md'
                  : isLight
                  ? 'text-black/60 hover:text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ImageIcon size={14} />
              Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? isLight
                    ? 'bg-[#2d2424] text-white shadow-sm'
                    : 'bg-white text-black shadow-md'
                  : isLight
                  ? 'text-black/60 hover:text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LinkIcon size={14} />
              Link
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="min-h-[220px] flex flex-col justify-center">
            {/* Tab 1: Upload Dropzone */}
            {activeTab === 'upload' && (
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`relative border border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  selectedFile
                    ? isLight
                      ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                      : 'border-blue-500/80 bg-blue-500/[0.05] shadow-[inset_0_1px_1px_rgba(59,130,246,0.3),inset_0_0_20px_rgba(59,130,246,0.05)]'
                    : isLight
                    ? 'border-black/15 hover:border-black/30 bg-black/[0.02] hover:bg-black/[0.04]'
                    : 'border-white/15 hover:border-white/35 bg-white/[0.02] hover:bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_0_20px_rgba(255,255,255,0.02)]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    mediaType === 'image'
                      ? 'image/*'
                      : mediaType === 'video'
                      ? 'video/*'
                      : 'audio/*'
                  }
                  disabled={isUploading}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center mb-2.5 ${
                    isLight
                      ? 'bg-black/[0.05] text-[#2d2424] border border-black/5'
                      : 'bg-white/[0.08] text-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                  }`}
                >
                  <CloudUpload size={22} />
                </div>

                {selectedFile ? (
                  <div className="flex flex-col items-center max-w-full px-2">
                    <span
                      className={`text-xs font-medium truncate max-w-[280px] ${
                        isLight ? 'text-[#2d2424]' : 'text-white'
                      }`}
                    >
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-blue-500 dark:text-blue-400 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                    </span>
                  </div>
                ) : (
                  <>
                    <p
                      className={`text-xs font-medium ${
                        isLight ? 'text-[#2d2424]' : 'text-white/90'
                      }`}
                    >
                      Drag & drop or click to browse
                    </p>
                    <p
                      className={`text-[11px] mt-1 ${
                        isLight ? 'text-[#7a6b6b]' : 'text-white/40'
                      }`}
                    >
                      Supports high quality {mediaType}s
                    </p>
                  </>
                )}

                {isUploading && (
                  <div className="w-full mt-3">
                    <div
                      className={`w-full rounded-full h-1.5 overflow-hidden ${
                        isLight ? 'bg-black/10' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          isLight ? 'bg-[#2d2424]' : 'bg-white'
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Presets Grid with Soft 3D Inner Shadow and Large Previews */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {samples.map((sample, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPresetIndex(idx)}
                    onDoubleClick={() => handleAddPreset(sample)}
                    className={`group relative rounded-2xl overflow-hidden p-2 flex flex-col cursor-pointer transition-all border ${
                      selectedPresetIndex === idx
                        ? isLight
                          ? 'border-[#2d2424] bg-black/[0.04] ring-2 ring-black/10 shadow-sm'
                          : 'border-white bg-white/[0.08] ring-2 ring-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_0_20px_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.5)]'
                        : isLight
                        ? 'border-black/10 hover:border-black/25 bg-black/[0.01]'
                        : 'border-white/10 hover:border-white/30 bg-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_0_16px_rgba(255,255,255,0.02)]'
                    }`}
                  >
                    {/* Image Preset: Large Cinematic Preview */}
                    {mediaType === 'image' && (
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-black mb-2 relative shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sample.url}
                          alt={sample.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Video Preset: Large Video Preview */}
                    {mediaType === 'video' && (
                      <div className="w-full h-28 rounded-xl overflow-hidden bg-black mb-2 relative shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]">
                        <video
                          src={sample.url}
                          muted
                          playsInline
                          loop
                          autoPlay
                          preload="metadata"
                          className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                        />
                        {(sample.storageMeta as any)?.duration && (
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] text-white/90 font-mono border border-white/10 shadow-sm">
                            {Math.round((sample.storageMeta as any).duration)}s
                          </div>
                        )}
                      </div>
                    )}

                    {/* Audio Preset: Waveform Preview */}
                    {mediaType === 'audio' && (
                      <div
                        className={`w-full h-20 rounded-xl overflow-hidden border mb-2 flex flex-col items-center justify-center p-3 ${
                          isLight
                            ? 'bg-black/[0.03] border-black/10 shadow-inner'
                            : 'bg-black/70 border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_0_16px_rgba(255,255,255,0.02)]'
                        }`}
                      >
                        <div className="flex items-center gap-1 h-7">
                          {[8, 14, 20, 12, 22, 16, 22, 10, 18, 12, 16, 8].map((h, barIdx) => (
                            <div
                              key={barIdx}
                              style={{
                                height: `${h}px`,
                                animation: `audioWaveformPulse 1.2s ease-in-out infinite alternate`,
                                animationDelay: `${barIdx * 0.08}s`,
                              }}
                              className={`w-[2.5px] rounded-full ${
                                isLight ? 'bg-[#2d2424]' : 'bg-white'
                              }`}
                            />
                          ))}
                        </div>
                        {(sample.storageMeta as any)?.duration && (
                          <span
                            className={`text-[10px] mt-1 font-mono ${
                              isLight ? 'text-black/50' : 'text-white/50'
                            }`}
                          >
                            {Math.round((sample.storageMeta as any).duration)}s
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between px-0.5">
                      <span
                        className={`text-[11px] font-medium truncate max-w-[85%] ${
                          isLight ? 'text-[#2d2424]' : 'text-white/90'
                        }`}
                      >
                        {sample.title}
                      </span>
                      {selectedPresetIndex === idx && (
                        <div
                          className={`w-2 h-2 rounded-full shadow-sm flex-shrink-0 ${
                            isLight ? 'bg-[#2d2424]' : 'bg-white'
                          }`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Paste URL */}
            {activeTab === 'url' && (
              <div className="space-y-3">
                <input
                  type="url"
                  placeholder={
                    mediaType === 'video'
                      ? 'https://youtube.com/... or https://...'
                      : 'https://...'
                  }
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddUrl();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                    isLight
                      ? 'bg-white border border-black/15 focus:border-black/40 text-[#2d2424] placeholder-black/35 shadow-sm focus:outline-none'
                      : 'bg-black/60 border border-white/15 focus:border-white/50 text-white placeholder-white/30 focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),inset_0_0_1px_rgba(255,255,255,0.1)]'
                  }`}
                />
                <p className={`text-[11px] ${isLight ? 'text-[#7a6b6b]' : 'text-white/40'}`}>
                  Direct image, video, audio, YouTube, Pinterest, or Cloudinary URL
                </p>
              </div>
            )}

            {/* Refined Error Card matching the Modal UI Language */}
            {uploadError && (
              <div
                className={`mt-3.5 p-4 rounded-2xl text-left space-y-3 animate-in fade-in duration-200 border ${
                  isLight
                    ? 'bg-red-50/80 border-red-200/80 shadow-sm'
                    : 'bg-[#1a1418] border-red-500/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_0_20px_rgba(239,68,68,0.05),0_8px_20px_rgba(0,0,0,0.5)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span
                      className={`text-xs font-semibold tracking-tight ${
                        isLight ? 'text-red-950' : 'text-white'
                      }`}
                    >
                      Upload Notice
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      isLight
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-red-500/15 text-red-400/90 border-red-500/20'
                    }`}
                  >
                    Configuration Required
                  </span>
                </div>
                <p
                  className={`text-[11px] leading-relaxed font-normal ${
                    isLight ? 'text-red-900/80' : 'text-white/70'
                  }`}
                >
                  {uploadError}
                </p>
                <div
                  className={`pt-2 border-t flex flex-wrap items-center gap-2 ${
                    isLight ? 'border-red-200/60' : 'border-white/5'
                  }`}
                >
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleAddAsLocal}
                      className={`px-4 py-2 rounded-full font-semibold text-xs transition-all cursor-pointer ${
                        isLight
                          ? 'bg-[#2d2424] hover:bg-[#1a1515] text-white shadow-sm'
                          : 'bg-white hover:bg-neutral-200 text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_8px_rgba(255,255,255,0.15)]'
                      }`}
                    >
                      Use as Local {mediaType === 'video' ? 'Video' : mediaType === 'image' ? 'Image' : 'Audio'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCloudinaryConfig();
                    }}
                    className={`px-4 py-2 rounded-full font-medium text-xs transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-black/[0.06] hover:bg-black/[0.1] text-[#2d2424]'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                    }`}
                  >
                    Configure Cloudinary
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Action Buttons - Matching Reference Image Pill Design with Soft 3D Lighting */}
          <div className="flex items-center gap-3 mt-6 pt-2">
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
              type="button"
              disabled={isUploading}
              onClick={handlePrimaryAction}
              className={`flex-1 py-3 px-6 rounded-full font-semibold text-xs transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                isLight
                  ? 'bg-[#2d2424] hover:bg-[#1a1515] text-white shadow-md'
                  : 'bg-white hover:bg-neutral-200 text-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(255,255,255,0.2)]'
              }`}
            >
              {primaryButtonLabel()}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
