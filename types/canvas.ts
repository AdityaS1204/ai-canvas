export type ItemType = 'text' | 'image' | 'video' | 'audio' | 'shape';
export type ShapeKind = 'rectangle' | 'circle' | 'line' | 'arrow';

export interface StorageMeta {
  provider: 'cloudinary' | 'external' | 'local';
  publicId?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  secureUrl?: string;
}

export interface CanvasItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  // Text specific
  content?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  // Media specific
  url?: string;
  title?: string;
  aspectRatio?: number;
  storageMeta?: StorageMeta;
  // Shape specific
  shapeKind?: ShapeKind;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  createdAt: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasState {
  version: string;
  items: CanvasItem[];
  strokes: DrawingStroke[];
  viewport: ViewportTransform;
  lastUpdated: number;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

export type ThemeMode = 'dark' | 'light';

export type ActiveTool = 'select' | 'pan' | 'pen' | 'text' | 'image' | 'video' | 'audio' | 'eraser' | 'shape';

