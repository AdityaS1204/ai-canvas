'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ActiveTool,
  CanvasItem,
  CanvasState,
  DrawingStroke,
  ViewportTransform,
  ItemType,
  StorageMeta,
  CloudinaryConfig,
} from '@/types/canvas';
import {
  loadSavedCanvasState,
  saveCanvasState,
  INITIAL_CANVAS_STATE,
} from '@/lib/storage';
import { getStoredCloudinaryConfig } from '@/lib/cloudinary';

// Components
import TextBoxItem from './TextBoxItem';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';
import AudioItem from './AudioItem';
import DrawingCanvas from './DrawingCanvas';
import SettingsDropdown from './SettingsDropdown';
import FloatingToolbar from '../toolbar/FloatingToolbar';
import MediaUploadModal from '../modals/MediaUploadModal';
import CloudinaryConfigModal from '../modals/CloudinaryConfigModal';
import JsonViewerModal from '../modals/JsonViewerModal';


export default function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas State
  const [items, setItems] = useState<CanvasItem[]>(INITIAL_CANVAS_STATE.items);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Active Tool & Pen state (restricted to blue, white, black)
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [penColor, setPenColor] = useState<string>('#2563eb');
  const [penWidth, setPenWidth] = useState<number>(4);

  // Modals state
  const [uploadModalType, setUploadModalType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(getStoredCloudinaryConfig());

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  // Load initial state on mount
  useEffect(() => {
    const saved = loadSavedCanvasState();
    if (saved && saved.items) {
      setItems(saved.items);
      setStrokes(saved.strokes || []);
      if (saved.viewport) {
        setPan({ x: saved.viewport.x, y: saved.viewport.y });
        setZoom(saved.viewport.scale || 1);
      } else {
        setPan({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    } else {
      setPan({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  }, []);

  // Auto-save state
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCanvasState({
        version: '1.0.0',
        items,
        strokes,
        viewport: { x: pan.x, y: pan.y, scale: zoom },
        lastUpdated: Date.now(),
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [items, strokes, pan, zoom]);

  // Convert Screen Coordinates to Canvas World Coordinates
  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      return {
        x: Math.round((clientX - pan.x) / zoom),
        y: Math.round((clientY - pan.y) / zoom),
      };
    },
    [pan, zoom]
  );

  // Get current center of the visible canvas viewport in world coordinates
  const getViewCenterWorld = useCallback(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    return screenToWorld(cx, cy);
  }, [screenToWorld]);

  // --- ITEM HANDLERS ---
  const handleUpdateItem = useCallback((id: string, updates: Partial<CanvasItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed) {
        showToast(`Removed ${removed.type} from canvas`);
      }
      return prev.filter((item) => item.id !== id);
    });
    setSelectedItemId((current) => (current === id ? null : current));
  }, []);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItemId(id);
    setItems((prev) => {
      const maxZ = Math.max(...prev.map((i) => i.zIndex), 0) + 1;
      return prev.map((item) => (item.id === id ? { ...item, zIndex: maxZ } : item));
    });
  }, []);

  // Create a new Text Box at specified world coordinates
  const createTextBoxAt = useCallback((worldX: number, worldY: number) => {
    const maxZ = Math.max(...items.map((i) => i.zIndex), 0) + 1;
    const newItem: CanvasItem = {
      id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'text',
      x: worldX,
      y: worldY,
      width: 320,
      height: 200,
      zIndex: maxZ,
      content: '',
      fontSize: 14,
      createdAt: Date.now(),
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    showToast('New text box opened');
  }, [items]);

  // Click Text Icon in toolbar -> creates new text box at center of canvas
  const handleAddTextBoxFromToolbar = () => {
    const center = getViewCenterWorld();
    createTextBoxAt(center.x - 160, center.y - 100);
  };

  // Add Media Item (Image, Video, Audio)
  const handleAddMedia = (data: {
    type: ItemType;
    url: string;
    title: string;
    width: number;
    height: number;
    storageMeta?: StorageMeta;
  }) => {
    const center = getViewCenterWorld();
    const maxZ = Math.max(...items.map((i) => i.zIndex), 0) + 1;

    const newItem: CanvasItem = {
      id: `${data.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: data.type,
      x: center.x - Math.round(data.width / 2) + Math.round((Math.random() - 0.5) * 50),
      y: center.y - Math.round(data.height / 2) + Math.round((Math.random() - 0.5) * 50),
      width: data.width,
      height: data.height,
      zIndex: maxZ,
      title: data.title,
      url: data.url,
      storageMeta: data.storageMeta,
      createdAt: Date.now(),
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    showToast(`Added ${data.type} to canvas`);
  };

  // --- NATIVE NON-PASSIVE WHEEL LISTENER (PREVENTS BROWSER PAGE ZOOM) ---
  const panRef = useRef(pan);
  panRef.current = pan;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Non-passive wheel handler: intercepts wheel and Ctrl+wheel to prevent any browser page zoom
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.15), 3.0);

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const newPanX = mouseX - (mouseX - currentPan.x) * (newZoom / currentZoom);
      const newPanY = mouseY - (mouseY - currentPan.y) * (newZoom / currentZoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    // Attach with { passive: false } to guarantee preventDefault works
    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    // Also guard window against Ctrl + wheel and trackpad pinch zoom
    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });

    // Guard against Safari/Trackpad gesture pinch zoom
    const preventGesture = (e: Event) => e.preventDefault();
    window.addEventListener('gesturestart', preventGesture);
    window.addEventListener('gesturechange', preventGesture);
    window.addEventListener('gestureend', preventGesture);

    // Prevent browser zoom keyboard shortcuts: Ctrl + '+', Ctrl + '-', Ctrl + '0'
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('gesturestart', preventGesture);
      window.removeEventListener('gesturechange', preventGesture);
      window.removeEventListener('gestureend', preventGesture);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // --- PANNING MECHANICS ---
  const isPanning = useRef(false);
  const isSpacePressed = useRef(false);
  const panStart = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pen') return;

    const isMiddleButton = e.button === 1;
    const isLeftButton = e.button === 0;
    const clickedOnCard = (e.target as HTMLElement).closest('.group');

    if (isMiddleButton || (isLeftButton && (!clickedOnCard || isSpacePressed.current))) {
      isPanning.current = true;
      panStart.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      if (!clickedOnCard) {
        setSelectedItemId(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.clientX;
    const dy = e.clientY - panStart.current.clientY;
    setPan({
      x: panStart.current.startPanX + dx,
      y: panStart.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  // Zoom buttons
  const handleZoomIn = () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const newZoom = Math.min(zoom * 1.25, 3.0);
    setPan({
      x: cx - (cx - pan.x) * (newZoom / zoom),
      y: cy - (cy - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const newZoom = Math.max(zoom * 0.8, 0.15);
    setPan({
      x: cx - (cx - pan.x) * (newZoom / zoom),
      y: cy - (cy - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setPan({
      x: cx - (cx - pan.x) * (1 / zoom),
      y: cy - (cy - pan.y) * (1 / zoom),
    });
    setZoom(1);
  };

  // Keyboard shortcuts (Spacebar for pan, V for select, P for pen, Delete to remove selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        isSpacePressed.current = true;
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool('pen');
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        handleRemoveItem(selectedItemId);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedItemId, handleRemoveItem]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      /* Removed double-click text box opening as requested */
      className={`relative w-screen h-screen overflow-hidden select-none bg-zinc-900 ${
        activeTool === 'pen'
          ? 'cursor-crosshair'
          : isPanning.current
          ? 'cursor-grabbing'
          : 'cursor-default'
      }`}
    >
      {/* Infinite Canvas Dots Grid */}
      <div
        className="absolute inset-0 pointer-events-none canvas-grid-dots"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          opacity: Math.min(Math.max(zoom * 0.9, 0.35), 0.8),
        }}
      />

      {/* Top Header (purely blue, white, black) */}
      <header className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">    
        {/* Top Right Morphing Settings Dropdown */}
        <div className="pointer-events-auto">
          <SettingsDropdown
            isCloudinaryConfigured={Boolean(cloudinaryConfig.uploadPreset)}
            onOpenCloudinaryModal={() => setIsCloudinaryModalOpen(true)}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
            onClearCanvas={() => {
              if (window.confirm('Clear all items and drawings from the canvas?')) {
                setItems([]);
                setStrokes([]);
                showToast('Canvas cleared');
              }
            }}
          />
        </div>
      </header>

      {/* World Canvas Content Layer */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render Canvas Items */}
        {items.map((item) => {
          const isSelected = selectedItemId === item.id;
          const commonProps = {
            item,
            zoom,
            isSelected,
            onSelect: handleSelectItem,
            onUpdate: handleUpdateItem,
            onRemove: handleRemoveItem,
          };

          if (item.type === 'text') {
            return <TextBoxItem key={item.id} {...commonProps} />;
          }
          if (item.type === 'video') {
            return <VideoItem key={item.id} {...commonProps} />;
          }
          if (item.type === 'image') {
            return <ImageItem key={item.id} {...commonProps} />;
          }
          if (item.type === 'audio') {
            return <AudioItem key={item.id} {...commonProps} />;
          }
          return null;
        })}
      </div>

      {/* Drawing Canvas Overlay */}
      <DrawingCanvas
        strokes={strokes}
        onAddStroke={(s) => setStrokes((prev) => [...prev, s])}
        isPenActive={activeTool === 'pen'}
        penColor={penColor}
        penWidth={penWidth}
        zoom={zoom}
        pan={pan}
      />

      {/* Floating Toolbar at Center Bottom (Pen, Text, Image, Media, Controls) with Margin at Bottom */}
      <FloatingToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        penColor={penColor}
        setPenColor={setPenColor}
        penWidth={penWidth}
        setPenWidth={setPenWidth}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onAddTextBox={handleAddTextBoxFromToolbar}
        onOpenUploadModal={(type) => setUploadModalType(type)}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenCloudinaryModal={() => setIsCloudinaryModalOpen(true)}
        onClearCanvas={() => setItems([])}
      />

      {/* Media Upload Modal */}
      {uploadModalType && (
        <MediaUploadModal
          isOpen={Boolean(uploadModalType)}
          mediaType={uploadModalType}
          onClose={() => setUploadModalType(null)}
          onAddMedia={handleAddMedia}
          onOpenCloudinaryConfig={() => setIsCloudinaryModalOpen(true)}
        />
      )}

      {/* Cloudinary Storage Settings Modal */}
      <CloudinaryConfigModal
        isOpen={isCloudinaryModalOpen}
        onClose={() => setIsCloudinaryModalOpen(false)}
        onSaved={(cfg) => {
          setCloudinaryConfig(cfg);
          showToast('Cloudinary settings saved');
        }}
      />

      {/* JSON Inspector & Import/Export Modal */}
      <JsonViewerModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        items={items}
        strokes={strokes}
        viewport={{ x: pan.x, y: pan.y, scale: zoom }}
        onImportState={(newState) => {
          setItems(newState.items);
          setStrokes(newState.strokes || []);
          if (newState.viewport) {
            setPan({ x: newState.viewport.x, y: newState.viewport.y });
            setZoom(newState.viewport.scale || 1);
          }
          showToast('Canvas JSON loaded');
        }}
      />

      {/* Toast Notification (pure blue, white, black) */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-black border border-white/20 text-white text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
