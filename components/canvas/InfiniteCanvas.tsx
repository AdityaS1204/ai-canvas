'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ActiveTool,
  CanvasItem,
  CanvasState,
  DrawingPoint,
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
import CanvasFrame from './CanvasFrame';
import FloatingToolbar from '../toolbar/FloatingToolbar';
import MediaUploadModal from '../modals/MediaUploadModal';
import CloudinaryConfigModal from '../modals/CloudinaryConfigModal';
import JsonViewerModal from '../modals/JsonViewerModal';
import ClearCanvasModal from '../modals/ClearCanvasModal';


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
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const isDrawing = useRef(false);
  const isErasing = useRef(false);
  const [toolbarDims, setToolbarDims] = useState<{ width: number; height: number }>({ width: 554, height: 48 });
  const [showGrid, setShowGrid] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('ai-canvas-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ai-canvas-theme', next);
      return next;
    });
  };

  // Modals state
  const [uploadModalType, setUploadModalType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
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

  // --- ERASER & STROKE COLLISION UTILITY ---
  const isPointNearStroke = (
    eraserPt: DrawingPoint,
    stroke: DrawingStroke,
    threshold: number
  ): boolean => {
    const points = stroke.points;
    if (!points || points.length === 0) return false;
    const strokeThresh = threshold + (stroke.width || 4) / 2;
    const threshSq = strokeThresh * strokeThresh;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const dx = p1.x - eraserPt.x;
      const dy = p1.y - eraserPt.y;
      if (dx * dx + dy * dy <= threshSq) return true;

      // Check proximity along segment between p1 and p2
      if (i < points.length - 1) {
        const p2 = points[i + 1];
        const segLenSq = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
        if (segLenSq > 0) {
          let t = ((eraserPt.x - p1.x) * (p2.x - p1.x) + (eraserPt.y - p1.y) * (p2.y - p1.y)) / segLenSq;
          t = Math.max(0, Math.min(1, t));
          const projX = p1.x + t * (p2.x - p1.x);
          const projY = p1.y + t * (p2.y - p1.y);
          const distSq = (eraserPt.x - projX) * (eraserPt.x - projX) + (eraserPt.y - projY) * (eraserPt.y - projY);
          if (distSq <= threshSq) return true;
        }
      }
    }
    return false;
  };

  const eraseStrokesAt = (worldPt: DrawingPoint) => {
    // 16px screen tolerance radius converted to world coordinates
    const threshold = 16 / zoom;
    setStrokes((prev) => {
      const remaining = prev.filter((s) => !isPointNearStroke(worldPt, s, threshold));
      if (remaining.length !== prev.length) {
        return remaining;
      }
      return prev;
    });
  };

  // --- PANNING & DRAWING MECHANICS ---
  const isPanning = useRef(false);
  const isSpacePressed = useRef(false);
  const panStart = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddleButton = e.button === 1;
    const isLeftButton = e.button === 0;

    // Middle button or Space+drag -> Pan canvas
    if (isMiddleButton || isSpacePressed.current) {
      isPanning.current = true;
      panStart.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      return;
    }

    // Pen tool active -> Draw stroke directly on canvas
    if (activeTool === 'pen' && isLeftButton) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback if pointer capture isn't available
      }
      isDrawing.current = true;
      const pt: DrawingPoint = {
        x: Number(((e.clientX - pan.x) / zoom).toFixed(1)),
        y: Number(((e.clientY - pan.y) / zoom).toFixed(1)),
      };
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        points: [pt],
        color: penColor,
        width: penWidth,
      };
      currentStrokeRef.current = newStroke;
      setCurrentStroke(newStroke);
      setSelectedItemId(null);
      return;
    }

    // Eraser tool active -> Click or start dragging to erase strokes
    if (activeTool === 'eraser' && isLeftButton) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      isErasing.current = true;
      const pt: DrawingPoint = {
        x: Number(((e.clientX - pan.x) / zoom).toFixed(1)),
        y: Number(((e.clientY - pan.y) / zoom).toFixed(1)),
      };
      eraseStrokesAt(pt);
      setSelectedItemId(null);
      return;
    }

    // Select tool active -> Left click on background pans canvas, deselects cards
    if (activeTool === 'select' && isLeftButton) {
      const clickedOnCard = (e.target as HTMLElement).closest('.group');
      if (!clickedOnCard) {
        isPanning.current = true;
        panStart.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          startPanX: pan.x,
          startPanY: pan.y,
        };
        setSelectedItemId(null);
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 1. Panning canvas
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.clientX;
      const dy = e.clientY - panStart.current.clientY;
      setPan({
        x: panStart.current.startPanX + dx,
        y: panStart.current.startPanY + dy,
      });
      return;
    }

    // 2. Drawing stroke with pen
    if (isDrawing.current && activeTool === 'pen' && currentStrokeRef.current) {
      const pt: DrawingPoint = {
        x: Number(((e.clientX - pan.x) / zoom).toFixed(1)),
        y: Number(((e.clientY - pan.y) / zoom).toFixed(1)),
      };
      const pts = currentStrokeRef.current.points;
      const last = pts[pts.length - 1];
      // Skip redundant micro-movements (less than 0.8px) for maximum performance
      if (!last || Math.hypot(last.x - pt.x, last.y - pt.y) >= 0.8) {
        const updated: DrawingStroke = {
          ...currentStrokeRef.current,
          points: [...pts, pt],
        };
        currentStrokeRef.current = updated;
        setCurrentStroke(updated);
      }
      return;
    }

    // 3. Erasing strokes with eraser tool
    if (isErasing.current && activeTool === 'eraser') {
      const pt: DrawingPoint = {
        x: Number(((e.clientX - pan.x) / zoom).toFixed(1)),
        y: Number(((e.clientY - pan.y) / zoom).toFixed(1)),
      };
      eraseStrokesAt(pt);
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    isPanning.current = false;
    isErasing.current = false;

    // Commit finished drawing stroke to canvas state
    if (isDrawing.current && currentStrokeRef.current) {
      isDrawing.current = false;
      const finalStroke = currentStrokeRef.current;
      currentStrokeRef.current = null;
      setCurrentStroke(null);
      if (finalStroke && finalStroke.points.length > 0) {
        setStrokes((prev) => [...prev, finalStroke]);
      }
    }
  };

  // Safety listener: if pointer is released anywhere outside canvas
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      isPanning.current = false;
      isErasing.current = false;
      if (isDrawing.current && currentStrokeRef.current) {
        isDrawing.current = false;
        const finalStroke = currentStrokeRef.current;
        currentStrokeRef.current = null;
        setCurrentStroke(null);
        if (finalStroke && finalStroke.points.length > 0) {
          setStrokes((prev) => [...prev, finalStroke]);
        }
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

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
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('eraser');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTool('shape');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        // Undo last drawn stroke
        e.preventDefault();
        setStrokes((prev) => {
          if (prev.length === 0) return prev;
          showToast('Undid drawing');
          return prev.slice(0, -1);
        });
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
    <CanvasFrame
      theme={theme}
      toolbarDims={toolbarDims}
      onToggleTheme={handleToggleTheme}
      isCloudinaryConfigured={Boolean(cloudinaryConfig.uploadPreset)}
      onOpenCloudinaryModal={() => setIsCloudinaryModalOpen(true)}
      onOpenJsonModal={() => setIsJsonModalOpen(true)}
      onResetZoom={handleResetZoom}
      onClearCanvas={() => setIsClearModalOpen(true)}
      overlays={
        <>
          {/* Floating Toolbar at Center Bottom (resting seamlessly inside the frame shelf) */}
          <FloatingToolbar
            theme={theme}
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
            onDimensionsChange={setToolbarDims}
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

          {/* Clear Canvas Confirmation Modal with SlideToConfirm */}
          <ClearCanvasModal
            isOpen={isClearModalOpen}
            onClose={() => setIsClearModalOpen(false)}
            theme={theme}
            onConfirmClear={() => {
              setItems([]);
              setStrokes([]);
              showToast('Canvas cleared');
            }}
          />

          {/* Toast Notification */}
          {toastMessage && (
            <div
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl border text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 ${
                theme === 'light'
                  ? 'bg-[#ffffff] border-[#d8cfcf] text-[#2d2424] shadow-black/10'
                  : 'bg-[#231b1b] border-[#524141] text-white shadow-black/80'
              }`}
            >
              {toastMessage}
            </div>
          )}
        </>
      }
    >
      <div
        ref={containerRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        className={`relative w-full h-full overflow-hidden select-none touch-none transition-colors duration-200 ${
          theme === 'light' ? 'bg-[#f7f4f4]' : 'bg-[#221b1b]'
        } ${
          activeTool === 'pen' || activeTool === 'eraser'
            ? 'cursor-crosshair'
            : isPanning.current
            ? 'cursor-grabbing'
            : 'cursor-default'
        }`}
      >
        {/* Infinite Canvas Dots Grid */}
        {showGrid && (
          <div
            className={`absolute inset-0 pointer-events-none ${
              theme === 'light' ? 'canvas-grid-dots-light' : 'canvas-grid-dots'
            }`}
            style={{
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
              opacity: Math.min(Math.max(zoom * 0.9, 0.25), 0.6),
            }}
          />
        )}

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
              theme,
              isPenActive: activeTool === 'pen' || activeTool === 'eraser',
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
          currentStroke={currentStroke}
          zoom={zoom}
          pan={pan}
        />
      </div>
    </CanvasFrame>
  );
}
