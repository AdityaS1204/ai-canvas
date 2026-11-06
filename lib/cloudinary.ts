import { CloudinaryConfig, StorageMeta } from '@/types/canvas';

const STORAGE_KEY = 'ai_canvas_cloudinary_config';

export const DEFAULT_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
};

export function getStoredCloudinaryConfig(): CloudinaryConfig {
  if (typeof window === 'undefined') return DEFAULT_CLOUDINARY_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CLOUDINARY_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to parse Cloudinary config from localStorage', e);
  }
  return DEFAULT_CLOUDINARY_CONFIG;
}

export function saveStoredCloudinaryConfig(config: CloudinaryConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Cloudinary config to localStorage', e);
  }
}

export interface UploadResult {
  url: string;
  storageMeta: StorageMeta;
  title: string;
}

/**
 * Uploads media file to Cloudinary using unsigned upload preset
 * If preset is not configured, fallback to reading file as data URL / blob URL for local preview
 */
export async function uploadToCloudinary(
  file: File,
  config: CloudinaryConfig,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const resourceType = isVideo ? 'video' : isAudio ? 'video' : 'image'; // Cloudinary treats audio under 'video' resource type

  // If cloudName and uploadPreset are provided, upload directly to Cloudinary
  if (config.cloudName && config.uploadPreset) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/upload`
      );

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              url: data.secure_url || data.url,
              title: file.name,
              storageMeta: {
                provider: 'cloudinary',
                publicId: data.public_id,
                format: data.format,
                bytes: data.bytes,
                width: data.width,
                height: data.height,
                duration: data.duration,
                secureUrl: data.secure_url,
              },
            });
          } catch {
            reject(new Error('Invalid Cloudinary JSON response'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData?.error?.message || `Cloudinary upload failed: HTTP ${xhr.status}`));
          } catch {
            reject(new Error(`Cloudinary upload failed with HTTP status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during Cloudinary upload'));
      };

      xhr.send(formData);
    });
  }

  // Fallback: If no upload preset is configured, load as local object URL / base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultUrl = reader.result as string;
      resolve({
        url: resultUrl,
        title: file.name,
        storageMeta: {
          provider: 'local',
          format: file.type.split('/')[1] || 'media',
          bytes: file.size,
        },
      });
    };
    reader.onerror = () => reject(new Error('Failed to read local file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Pre-curated sample Cloudinary assets for immediate testing
 */
export const SAMPLE_CLOUDINARY_MEDIA = {
  images: [
    {
      title: 'Neon Cyberpunk City',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      storageMeta: {
        provider: 'cloudinary' as const,
        publicId: 'samples/landscapes/neon-city',
        format: 'jpg',
        bytes: 420000,
        width: 1200,
        height: 800,
        secureUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      },
    },
    {
      title: 'Serene Mountain Vista',
      url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      storageMeta: {
        provider: 'cloudinary' as const,
        publicId: 'sample',
        format: 'jpg',
        bytes: 350000,
        width: 864,
        height: 576,
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      },
    },
    {
      title: 'Cosmic Nebula',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      storageMeta: {
        provider: 'cloudinary' as const,
        publicId: 'samples/space/nebula',
        format: 'jpg',
        bytes: 512000,
        width: 1200,
        height: 800,
        secureUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      },
    },
  ],
  videos: [
    {
      title: 'Cloudinary Sea Turtle Demo',
      url: 'https://res.cloudinary.com/demo/video/upload/v1580218765/sea_turtle.mp4',
      storageMeta: {
        provider: 'cloudinary' as const,
        publicId: 'sea_turtle',
        format: 'mp4',
        bytes: 3500000,
        duration: 12,
        width: 640,
        height: 360,
        secureUrl: 'https://res.cloudinary.com/demo/video/upload/v1580218765/sea_turtle.mp4',
      },
    },
    {
      title: 'Big Buck Bunny Clip',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      storageMeta: {
        provider: 'cloudinary' as const,
        publicId: 'samples/video/blazes',
        format: 'mp4',
        bytes: 2800000,
        duration: 15,
        width: 1280,
        height: 720,
        secureUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
    },
  ],
  audios: [
    {
      title: 'Ambient Chill Synthwave',
      url: 'https://actions.google.com/sounds/v1/science_fiction/deep_hum.ogg',
      storageMeta: {
        provider: 'cloudinary' as const,
        publicId: 'samples/audio/deep_hum',
        format: 'ogg',
        bytes: 320000,
        duration: 25,
        secureUrl: 'https://actions.google.com/sounds/v1/science_fiction/deep_hum.ogg',
      },
    },
    {
      title: 'Cosmic Wind Chimes',
      url: 'https://actions.google.com/sounds/v1/weather/wind_synthesized.ogg',
      storageMeta: {
        provider: 'cloudinary' as const,
        publicId: 'samples/audio/wind_chimes',
        format: 'ogg',
        bytes: 480000,
        duration: 30,
        secureUrl: 'https://actions.google.com/sounds/v1/weather/wind_synthesized.ogg',
      },
    },
  ],
};

