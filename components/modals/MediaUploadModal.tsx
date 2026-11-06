'use client';

import React, { useState } from 'react';
import { ItemType, StorageMeta } from '@/types/canvas';
import {
  getStoredCloudinaryConfig,
  uploadToCloudinary,
  SAMPLE_CLOUDINARY_MEDIA,
} from '@/lib/cloudinary';
import { parseVideoUrl } from '@/lib/video-parser';
import { Close, CloudUpload, Image as ImageIcon, FileVideo, MusicNote } from '@honeyicons/react';

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
  onOpenCloudinaryConfig,
}: MediaUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'samples' | 'url'>('samples');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const config = getStoredCloudinaryConfig();
  const isCloudinaryConfigured = Boolean(config.cloudName && config.uploadPreset);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const result = await uploadToCloudinary(file, config, (percent) => {
        setUploadProgress(percent);
      });

      const defaultDims =
        mediaType === 'image'
          ? { width: 420, height: 290 }
          : mediaType === 'video'
          ? { width: 440, height: 300 }
          : { width: 360, height: 180 };

      onAddMedia({
        type: mediaType,
        url: result.url,
        title: customTitle.trim() || result.title || `${mediaType.toUpperCase()} Asset`,
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

  const handleAddSample = (sample: any) => {
    const defaultDims =
      mediaType === 'image'
        ? { width: 420, height: 290 }
        : mediaType === 'video'
        ? { width: 440, height: 300 }
        : { width: 360, height: 180 };

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

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = customUrl.trim();
    if (!trimmedUrl) return;

    const defaultDims =
      mediaType === 'image'
        ? { width: 420, height: 290 }
        : mediaType === 'video'
        ? { width: 440, height: 300 }
        : { width: 360, height: 180 };

    let defaultTitle = customTitle.trim();
    let provider: 'cloudinary' | 'external' = trimmedUrl.includes('cloudinary') ? 'cloudinary' : 'external';

    if (mediaType === 'video') {
      const parsed = parseVideoUrl(trimmedUrl);
      if (!defaultTitle) {
        defaultTitle = parsed.titleFallback;
      }
    } else if (!defaultTitle) {
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

  const samples =
    mediaType === 'image'
      ? SAMPLE_CLOUDINARY_MEDIA.images
      : mediaType === 'video'
      ? SAMPLE_CLOUDINARY_MEDIA.videos
      : SAMPLE_CLOUDINARY_MEDIA.audios;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-black border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              {mediaType === 'image' && <ImageIcon size={20} />}
              {mediaType === 'video' && <FileVideo size={20} />}
              {mediaType === 'audio' && <MusicNote size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-white capitalize">Add {mediaType}</h3>
              <p className="text-xs text-white/50">Position and metadata stored in JSON</p>
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

        {/* Cloudinary Status Banner */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-black border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudinaryConfigured ? 'bg-blue-500' : 'bg-white/40'
              }`}
            />
            <span className="text-white/80">
              {isCloudinaryConfigured
                ? `Cloudinary Ready (${config.cloudName})`
                : 'Using Cloudinary Media & Storage'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCloudinaryConfig();
            }}
            className="text-blue-400 hover:text-white font-medium underline text-[11px] cursor-pointer"
          >
            Configure
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 pt-3 gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`pb-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'samples'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Cloudinary Samples
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'url'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Paste URL
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: SAMPLES */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-white/60">
                Select a Cloudinary asset to render directly on canvas:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {samples.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSample(s)}
                    className="flex flex-col text-left p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-blue-500/60 transition-all group cursor-pointer"
                  >
                    {mediaType === 'image' && (
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-black mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.url}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <span className="font-medium text-xs text-white truncate">{s.title}</span>
                    <span className="text-[10px] text-blue-400 mt-1 flex items-center gap-1">
                      <span>Cloudinary</span>
                      <span>•</span>
                      <span>{s.storageMeta?.format?.toUpperCase()}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`My ${mediaType}`}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="relative border-2 border-dashed border-white/20 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors bg-white/[0.02]">
                <input
                  type="file"
                  accept={
                    mediaType === 'image'
                      ? 'image/*'
                      : mediaType === 'video'
                      ? 'video/*'
                      : 'audio/*'
                  }
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 mb-2">
                  <CloudUpload size={24} />
                </div>
                <p className="text-xs font-medium text-white">Click or drag a {mediaType} file</p>
                <p className="text-[11px] text-white/50 mt-1">
                  Uploads directly to Cloudinary storage
                </p>

                {isUploading && (
                  <div className="w-full mt-4">
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-blue-400 mt-1.5 inline-block">
                      Uploading to Cloudinary: {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-white/5 border border-white/20 rounded-xl text-white text-xs">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PASTE URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleAddUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  {mediaType === 'video'
                    ? 'Video Link (YouTube, Pinterest, Cloudinary, MP4)'
                    : `${mediaType.toUpperCase()} URL`}
                </label>
                <input
                  type="url"
                  required
                  placeholder={
                    mediaType === 'video'
                      ? 'https://youtube.com/watch?v=... or https://pinterest.com/pin/...'
                      : 'https://res.cloudinary.com/... or https://...'
                  }
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Asset label"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Add to Canvas
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
