import { CanvasItem, CanvasState, DrawingStroke, ViewportTransform } from '@/types/canvas';
import { SAMPLE_CLOUDINARY_MEDIA } from './cloudinary';

const LOCAL_STORAGE_CANVAS_KEY = 'ai_canvas_project_state_v1';

export const INITIAL_CANVAS_ITEMS: CanvasItem[] = [
  {
    id: 'item-welcome-text',
    type: 'text',
    x: -360,
    y: -220,
    width: 320,
    height: 180,
    zIndex: 1,
    content: '✨ Welcome to AI Infinite Canvas\n\n• Click the text icon in the toolbar to add a text note.\n• Drag any card from its top bar to move it.\n• Click ✕ on the top right to remove a card.\n• Smooth zoom with mouse wheel without affecting the page.\n• Add images, videos, and audios from Cloudinary.',
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#d8dade',
    createdAt: Date.now() - 30000,
  },
  {
    id: 'item-sample-image',
    type: 'image',
    x: 0,
    y: -220,
    width: 380,
    height: 250,
    zIndex: 2,
    title: SAMPLE_CLOUDINARY_MEDIA.images[0].title,
    url: SAMPLE_CLOUDINARY_MEDIA.images[0].url,
    storageMeta: SAMPLE_CLOUDINARY_MEDIA.images[0].storageMeta,
    createdAt: Date.now() - 25000,
  },
  {
    id: 'item-sample-video',
    type: 'video',
    x: 420,
    y: -220,
    width: 400,
    height: 280,
    zIndex: 3,
    title: SAMPLE_CLOUDINARY_MEDIA.videos[0].title,
    url: SAMPLE_CLOUDINARY_MEDIA.videos[0].url,
    storageMeta: SAMPLE_CLOUDINARY_MEDIA.videos[0].storageMeta,
    createdAt: Date.now() - 20000,
  },
  {
    id: 'item-sample-audio',
    type: 'audio',
    x: -360,
    y: 20,
    width: 340,
    height: 150,
    zIndex: 4,
    title: SAMPLE_CLOUDINARY_MEDIA.audios[0].title,
    url: SAMPLE_CLOUDINARY_MEDIA.audios[0].url,
    storageMeta: SAMPLE_CLOUDINARY_MEDIA.audios[0].storageMeta,
    createdAt: Date.now() - 15000,
  },
];

export const INITIAL_CANVAS_STATE: CanvasState = {
  version: '1.0.0',
  items: INITIAL_CANVAS_ITEMS,
  strokes: [],
  viewport: { x: 0, y: 0, scale: 1 },
  lastUpdated: Date.now(),
};

export function loadSavedCanvasState(): CanvasState {
  if (typeof window === 'undefined') return INITIAL_CANVAS_STATE;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CANVAS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.items)) {
        return parsed as CanvasState;
      }
    }
  } catch (err) {
    console.error('Error reading canvas state from localStorage', err);
  }
  return INITIAL_CANVAS_STATE;
}

export function saveCanvasState(state: CanvasState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CANVAS_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving canvas state to localStorage', err);
  }
}

export function exportCanvasToJson(items: CanvasItem[], strokes: DrawingStroke[], viewport: ViewportTransform): string {
  const exportPayload: CanvasState = {
    version: '1.0.0',
    items,
    strokes,
    viewport,
    lastUpdated: Date.now(),
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function downloadJsonFile(content: string, filename = 'ai-canvas-data.json') {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

