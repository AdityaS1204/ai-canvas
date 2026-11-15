'use client';

import React, { useState, useRef } from 'react';
import { ItemType, StorageMeta } from '@/types/canvas';
import {
  getStoredCloudinaryConfig,
  uploadToCloudinary,
  SAMPLE_CLOUDINARY_MEDIA,
} from '@/lib/cloudinary';
import { parseVideoUrl } from '@/lib/video-parser';
import { Close, CloudUpload, Link as LinkIcon, Image as ImageIcon } from '@honeyicons/react';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'image' | 'video' | 'audio';
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

export default function MediaUploadModal({
  isOpen,
  onClose,
  mediaType,
  onAddMedia,
  onOpenCloudinaryConfig: _onOpenCloudinaryConfig,
}: MediaUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const config = getStoredCloudinaryConfig();

  // Cinematic Banner Images for top of modal matching reference photo
  const bannerImages = {
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop', // Golden hour wheat field with warm sunset lighting
    video:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop', // 35mm cinematic anamorphic camera lens
    audio:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop', // Studio soundstage with warm cinematic rim light
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[460px] bg-[#161519] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Banner Image with Cinematic Lighting */}
        <div className="relative w-full h-44 overflow-hidden rounded-t-[28px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerImages[mediaType]}
            alt={`${mediaType} Banner`}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
          {/* Gradient fade to seamlessly blend with dark container */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161519] via-[#161519]/25 to-black/20" />

          {/* Floating subtle circular close button */}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white/80 hover:text-white border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            <Close size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 pt-2 pb-6 flex flex-col">
          {/* Header text - minimal and clean */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white tracking-tight capitalize">
              Upload {mediaType}
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Select a file, choose a preset, or paste a link.
            </p>
          </div>

          {/* Tab Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.05] rounded-full w-fit mb-5 border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-black shadow-md'
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
                  ? 'bg-white text-black shadow-md'
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
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LinkIcon size={14} />
              Link
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="min-h-[170px] flex flex-col justify-center">
            {/* Tab 1: Upload Dropzone */}
            {activeTab === 'upload' && (
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`relative border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  selectedFile
                    ? 'border-blue-500/80 bg-blue-500/[0.05]'
                    : 'border-white/15 hover:border-white/35 bg-white/[0.02] hover:bg-white/[0.04]'
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

                <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center text-white/80 mb-2.5">
                  <CloudUpload size={20} />
                </div>

                {selectedFile ? (
                  <div className="flex flex-col items-center max-w-full px-2">
                    <span className="text-xs font-medium text-white truncate max-w-[260px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-blue-400 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-white/90">
                      Drag & drop or click to browse
                    </p>
                    <p className="text-[11px] text-white/40 mt-1">
                      Supports high quality {mediaType}s
                    </p>
                  </>
                )}

                {isUploading && (
                  <div className="w-full mt-3">
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-white h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Cinematic Presets Grid */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-2 gap-2.5 max-h-[190px] overflow-y-auto pr-1">
                {samples.map((sample, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPresetIndex(idx)}
                    onDoubleClick={() => handleAddPreset(sample)}
                    className={`relative rounded-xl overflow-hidden p-2 flex flex-col cursor-pointer transition-all border ${
                      selectedPresetIndex === idx
                        ? 'border-white bg-white/[0.08] ring-1 ring-white/50'
                        : 'border-white/10 hover:border-white/25 bg-white/[0.02]'
                    }`}
                  >
                    {mediaType === 'image' && (
                      <div className="w-full h-16 rounded-lg overflow-hidden bg-black mb-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sample.url}
                          alt={sample.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <span className="text-[11px] font-medium text-white/90 truncate">
                      {sample.title}
                    </span>
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
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 focus:border-white/50 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-white/40">
                  Direct image, video, YouTube, Pinterest, or Cloudinary URL
                </p>
              </div>
            )}

            {uploadError && (
              <p className="text-[11px] text-red-400 mt-2 text-center">{uploadError}</p>
            )}
          </div>

          {/* Bottom Footer Action Buttons - Matching Reference Image Pill Design */}
          <div className="flex items-center gap-3 mt-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white font-medium text-xs transition-colors cursor-pointer text-center"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={handlePrimaryAction}
              className="flex-1 py-3 px-6 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all shadow-lg cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {primaryButtonLabel()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
