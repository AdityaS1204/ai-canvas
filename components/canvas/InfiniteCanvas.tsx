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
  ShapeKind,
  StorageMeta,
  CloudinaryConfig,
  CanvasConnector,
  AnchorSide,
} from '@/types/canvas';
import {
  loadSavedCanvasState,
  saveCanvasState,
  INITIAL_CANVAS_STATE,
} from '@/lib/storage';
import { getStoredCloudinaryConfig, DEFAULT_CLOUDINARY_CONFIG } from '@/lib/cloudinary';
import { findNearestAnchor, getAnchorPosition } from '@/lib/connectorUtils';

// Components
import TextBoxItem from './TextBoxItem';
import ImageItem from './ImageItem';
import VideoItem from './VideoItem';
import AudioItem from './AudioItem';
import ShapeItem from './ShapeItem';
import DrawingCanvas, { getStrokeBounds } from './DrawingCanvas';
import ConnectorLayer from './ConnectorLayer';
import CanvasFrame from './CanvasFrame';
import FloatingToolbar from '../toolbar/FloatingToolbar';
import MediaUploadModal from '../modals/MediaUploadModal';
import CloudinaryConfigModal from '../modals/CloudinaryConfigModal';
import JsonViewerModal from '../modals/JsonViewerModal';
import ClearCanvasModal from '../modals/ClearCanvasModal';


interface HistorySnapshot {
  items: CanvasItem[];
  strokes: DrawingStroke[];
  connectors: CanvasConnector[];
}

export default function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas State
  const [items, setItems] = useState<CanvasItem[]>(INITIAL_CANVAS_STATE.items);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const selectedItemIdsRef = useRef(selectedItemIds);
  selectedItemIdsRef.current = selectedItemIds;
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const selectedStrokeIdsRef = useRef(selectedStrokeIds);
  selectedStrokeIdsRef.current = selectedStrokeIds;
  const selectedItemId = selectedItemIds.length === 1 ? selectedItemIds[0] : null;

  // Connectors State
  const [connectors, setConnectors] = useState<CanvasConnector[]>(INITIAL_CANVAS_STATE.connectors || []);
  const connectorsRef = useRef(connectors);
  connectorsRef.current = connectors;
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);

  // Full History Stack (Undo / Redo)
  const undoStackRef = useRef<HistorySnapshot[]>([]);
  const redoStackRef = useRef<HistorySnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);



  // Connecting Draft State
  const [connectingDraft, setConnectingDraft] = useState<{
    connectorId?: string;
    reconnectingEnd?: 'from' | 'to';
    fromItem: CanvasItem;
    fromSide: AnchorSide;
    currentPos: { x: number; y: number };
  } | null>(null);
  const [snappedAnchor, setSnappedAnchor] = useState<{
    itemId: string;
    side: AnchorSide;
  } | null>(null);
  const snappedAnchorRef = useRef<{ itemId: string; side: AnchorSide } | null>(null);
  snappedAnchorRef.current = snappedAnchor;

  // Multi-selection & Marquee state
  const isMarqueeSelecting = useRef(false);
  const marqueeStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const dragItemStartPositions = useRef<Record<string, { x: number; y: number }>>({});
  const dragStrokeStartPositions = useRef<Record<string, DrawingPoint[]>>({});

  // Active Tool & Pen/Shape color state
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [penColor, setPenColor] = useState<string>('#2563eb');
  const [penWidth, setPenWidth] = useState<number>(4);
  const [shapeColor, setShapeColor] = useState<string>('#2563eb');
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
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(DEFAULT_CLOUDINARY_CONFIG);

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
    setCloudinaryConfig(getStoredCloudinaryConfig());
    const saved = loadSavedCanvasState();
    if (saved && saved.items) {
      setItems(saved.items);
      setStrokes(saved.strokes || []);
      setConnectors(saved.connectors || []);
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
        connectors,
        viewport: { x: pan.x, y: pan.y, scale: zoom },
        lastUpdated: Date.now(),
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [items, strokes, connectors, pan, zoom]);

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

  // --- FULL CANVAS HISTORY (UNDO / REDO) ---
  const pushHistorySnapshot = useCallback(() => {
    const snapshot: HistorySnapshot = {
      items: JSON.parse(JSON.stringify(itemsRef.current)),
      strokes: JSON.parse(JSON.stringify(strokesRef.current)),
      connectors: JSON.parse(JSON.stringify(connectorsRef.current)),
    };
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  // Comprehensive Undo (Ctrl+Z / Cmd+Z)
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) {
      showToast('Nothing to undo');
      return;
    }

    const currentSnapshot: HistorySnapshot = {
      items: JSON.parse(JSON.stringify(itemsRef.current)),
      strokes: JSON.parse(JSON.stringify(strokesRef.current)),
      connectors: JSON.parse(JSON.stringify(connectorsRef.current)),
    };
    redoStackRef.current.push(currentSnapshot);

    const prev = undoStackRef.current.pop()!;
    setItems(prev.items);
    setStrokes(prev.strokes);
    setConnectors(prev.connectors);
    setSelectedItemIds([]);
    setSelectedStrokeIds([]);
    setSelectedConnectorId(null);

    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    showToast('Undone (Ctrl+Z)');
  }, []);

  // Comprehensive Redo (Ctrl+Y / Cmd+Y / Ctrl+Shift+Z)
  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) {
      showToast('Nothing to redo');
      return;
    }

    const currentSnapshot: HistorySnapshot = {
      items: JSON.parse(JSON.stringify(itemsRef.current)),
      strokes: JSON.parse(JSON.stringify(strokesRef.current)),
      connectors: JSON.parse(JSON.stringify(connectorsRef.current)),
    };
    undoStackRef.current.push(currentSnapshot);

    const next = redoStackRef.current.pop()!;
    setItems(next.items);
    setStrokes(next.strokes);
    setConnectors(next.connectors);
    setSelectedItemIds([]);
    setSelectedStrokeIds([]);
    setSelectedConnectorId(null);

    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    showToast('Redone (Ctrl+Y)');
  }, []);



  // --- ITEM HANDLERS ---
  const handleUpdateItem = useCallback((id: string, updates: Partial<CanvasItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    pushHistorySnapshot();
    setItems((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed) {
        showToast(`Removed ${removed.type} from canvas`);
      }
      return prev.filter((item) => item.id !== id);
    });
    setSelectedItemIds((current) => current.filter((i) => i !== id));
    // Clean up any connectors anchored to this item
    setConnectors((prev) =>
      prev.filter((c) => {
        const fromId = typeof c.from === 'object' && 'itemId' in c.from ? c.from.itemId : null;
        const toId = typeof c.to === 'object' && 'itemId' in c.to ? c.to.itemId : null;
        return fromId !== id && toId !== id;
      })
    );
  }, [pushHistorySnapshot]);

  const handleRemoveSelectedItems = useCallback(() => {
    const itemIds = selectedItemIdsRef.current;
    const strokeIds = selectedStrokeIdsRef.current;
    if (itemIds.length === 0 && strokeIds.length === 0) return;

    pushHistorySnapshot();
    const count = itemIds.length + strokeIds.length;

    if (itemIds.length > 0) {
      setItems((itemsList) => itemsList.filter((item) => !itemIds.includes(item.id)));
      setConnectors((prev) =>
        prev.filter((c) => {
          const fromId = typeof c.from === 'object' && 'itemId' in c.from ? c.from.itemId : null;
          const toId = typeof c.to === 'object' && 'itemId' in c.to ? c.to.itemId : null;
          return !itemIds.includes(fromId || '') && !itemIds.includes(toId || '');
        })
      );
      setSelectedItemIds([]);
    }

    if (strokeIds.length > 0) {
      setStrokes((prev) => prev.filter((s) => !strokeIds.includes(s.id)));
      setSelectedStrokeIds([]);
    }

    showToast(count === 1 ? 'Removed item' : `Removed ${count} items`);
  }, [pushHistorySnapshot]);

  const handleSelectItem = useCallback((id: string, e?: React.MouseEvent) => {
    setSelectedConnectorId(null);
    const isShift = e?.shiftKey;
    if (!isShift) {
      setSelectedStrokeIds([]);
    }
    setSelectedItemIds((prev) => {
      if (isShift) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      }
      if (prev.includes(id)) {
        return prev;
      }
      return [id];
    });

    setItems((prev) => {
      const maxZ = Math.max(...prev.map((i) => i.zIndex), 0) + 1;
      return prev.map((item) => (item.id === id ? { ...item, zIndex: maxZ } : item));
    });
  }, []);

  // --- SMART CONNECTOR HANDLERS ---
  const handleStartConnect = useCallback(
    (itemId: string, side: AnchorSide, e: React.MouseEvent) => {
      e.stopPropagation();
      const fromItem = itemsRef.current.find((it) => it.id === itemId);
      if (!fromItem) return;

      const fromPos = getAnchorPosition(fromItem, side);
      setConnectingDraft({
        fromItem,
        fromSide: side,
        currentPos: fromPos,
      });
      setSnappedAnchor(null);
      setSelectedConnectorId(null);
      setSelectedItemIds([]);
    },
    []
  );

  const handleStartDragEndpoint = useCallback(
    (connectorId: string, endpoint: 'from' | 'to', e: React.MouseEvent) => {
      e.stopPropagation();
      const conn = connectors.find((c) => c.id === connectorId);
      if (!conn) return;

      const fixedEnd = endpoint === 'from' ? conn.to : conn.from;
      if (typeof fixedEnd === 'object' && 'itemId' in fixedEnd) {
        const fixedItem = itemsRef.current.find((it) => it.id === fixedEnd.itemId);
        if (fixedItem) {
          const currentPos = screenToWorld(e.clientX, e.clientY);
          setConnectingDraft({
            connectorId,
            reconnectingEnd: endpoint,
            fromItem: fixedItem,
            fromSide: fixedEnd.side,
            currentPos,
          });
          setSnappedAnchor(null);
        }
      }
    },
    [connectors, screenToWorld]
  );

  const handleUpdateConnector = useCallback(
    (id: string, updates: Partial<CanvasConnector>) => {
      setConnectors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const handleRemoveConnector = useCallback((id: string) => {
    pushHistorySnapshot();
    setConnectors((prev) => prev.filter((c) => c.id !== id));
    setSelectedConnectorId((curr) => (curr === id ? null : curr));
    showToast('Connector removed');
  }, [pushHistorySnapshot]);

  // Track dragging connector across canvas and detect magnetic snapping to nearest anchor
  useEffect(() => {
    if (!connectingDraft) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const nearest = findNearestAnchor(
        itemsRef.current,
        worldPos.x,
        worldPos.y,
        connectingDraft.fromItem.id,
        36
      );

      setSnappedAnchor(nearest ? { itemId: nearest.item.id, side: nearest.side } : null);
      setConnectingDraft((prev) =>
        prev
          ? {
              ...prev,
              currentPos: nearest ? nearest.position : worldPos,
            }
          : null
      );
    };

    const handleWindowPointerUp = () => {
      const target = snappedAnchorRef.current;
      if (target) {
        pushHistorySnapshot();
        if (connectingDraft.connectorId && connectingDraft.reconnectingEnd) {
          const connId = connectingDraft.connectorId;
          const end = connectingDraft.reconnectingEnd;
          setConnectors((prev) =>
            prev.map((c) => {
              if (c.id !== connId) return c;
              if (end === 'from') {
                return { ...c, from: { itemId: target.itemId, side: target.side } };
              } else {
                return { ...c, to: { itemId: target.itemId, side: target.side } };
              }
            })
          );
          setSelectedConnectorId(connId);
          showToast('Connector re-anchored');
        } else {
          const newConn: CanvasConnector = {
            id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            from: { itemId: connectingDraft.fromItem.id, side: connectingDraft.fromSide },
            to: { itemId: target.itemId, side: target.side },
            color: '#3b82f6',
            strokeWidth: 2.5,
            style: 'orthogonal',
            hasArrow: true,
            createdAt: Date.now(),
          };
          setConnectors((prev) => [...prev, newConn]);
          setSelectedConnectorId(newConn.id);
          showToast('Connected!');
        }
      }
      setConnectingDraft(null);
      setSnappedAnchor(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [connectingDraft, screenToWorld, pushHistorySnapshot]);

  // Multi-drag: snapshot start positions when drag starts on any item in selection
  const handleDragStartItem = useCallback((id: string) => {
    pushHistorySnapshot();
    setSelectedItemIds((prev) => {
      const active = prev.includes(id) ? prev : [id];
      const starts: Record<string, { x: number; y: number }> = {};
      itemsRef.current.forEach((it) => {
        if (active.includes(it.id)) {
          starts[it.id] = { x: it.x, y: it.y };
        }
      });
      dragItemStartPositions.current = starts;
      return active;
    });

    // Also record start positions for any selected strokes
    const strokeStarts: Record<string, DrawingPoint[]> = {};
    strokesRef.current.forEach((st) => {
      if (selectedStrokeIdsRef.current.includes(st.id)) {
        strokeStarts[st.id] = st.points.map((p) => ({ x: p.x, y: p.y }));
      }
    });
    dragStrokeStartPositions.current = strokeStarts;
  }, [pushHistorySnapshot]);

  // Multi-drag: move all selected items simultaneously by the same world delta
  const handleDragMoveItem = useCallback((id: string, deltaX: number, deltaY: number) => {
    const starts = dragItemStartPositions.current;
    setItems((prev) =>
      prev.map((it) => {
        const start = starts[it.id];
        if (start) {
          return {
            ...it,
            x: Math.round(start.x + deltaX),
            y: Math.round(start.y + deltaY),
          };
        }
        return it;
      })
    );

    // Also move any selected strokes simultaneously
    const strokeStarts = dragStrokeStartPositions.current;
    if (Object.keys(strokeStarts).length > 0) {
      setStrokes((prev) =>
        prev.map((st) => {
          const orig = strokeStarts[st.id];
          if (orig) {
            return {
              ...st,
              points: orig.map((p) => ({
                x: Number((p.x + deltaX).toFixed(1)),
                y: Number((p.y + deltaY).toFixed(1)),
              })),
            };
          }
          return st;
        })
      );
    }
  }, []);

  // Multi-drag & selection for pen-drawn strokes
  const handleStrokePointerDown = useCallback(
    (strokeId: string, e: React.PointerEvent) => {
      if (e.button !== 0) return; // Only primary mouse button
      setSelectedConnectorId(null);

      const isShift = e.shiftKey;
      let activeStrokeIds = selectedStrokeIdsRef.current;
      let activeItemIds = selectedItemIdsRef.current;

      if (isShift) {
        if (activeStrokeIds.includes(strokeId)) {
          activeStrokeIds = activeStrokeIds.filter((id) => id !== strokeId);
        } else {
          activeStrokeIds = [...activeStrokeIds, strokeId];
        }
        setSelectedStrokeIds(activeStrokeIds);
      } else {
        if (!activeStrokeIds.includes(strokeId)) {
          activeStrokeIds = [strokeId];
          setSelectedStrokeIds([strokeId]);
          setSelectedItemIds([]);
          activeItemIds = [];
        }
      }

      // Snapshot starting positions of selected items and strokes
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      let hasPushedHistory = false;

      const itemStarts: Record<string, { x: number; y: number }> = {};
      itemsRef.current.forEach((it) => {
        if (activeItemIds.includes(it.id)) {
          itemStarts[it.id] = { x: it.x, y: it.y };
        }
      });

      const strokeStarts: Record<string, DrawingPoint[]> = {};
      strokesRef.current.forEach((st) => {
        if (activeStrokeIds.includes(st.id)) {
          strokeStarts[st.id] = st.points.map((p) => ({ x: p.x, y: p.y }));
        }
      });

      const handlePointerMove = (moveEvt: PointerEvent) => {
        const rawDx = moveEvt.clientX - startClientX;
        const rawDy = moveEvt.clientY - startClientY;

        if (!hasPushedHistory && (Math.abs(rawDx) > 3 || Math.abs(rawDy) > 3)) {
          hasPushedHistory = true;
          pushHistorySnapshot();
        }
        if (!hasPushedHistory) return;

        const deltaX = rawDx / zoom;
        const deltaY = rawDy / zoom;

        // Move items
        if (Object.keys(itemStarts).length > 0) {
          setItems((prev) =>
            prev.map((it) => {
              const start = itemStarts[it.id];
              if (start) {
                return {
                  ...it,
                  x: Math.round(start.x + deltaX),
                  y: Math.round(start.y + deltaY),
                };
              }
              return it;
            })
          );
        }

        // Move strokes
        if (Object.keys(strokeStarts).length > 0) {
          setStrokes((prev) =>
            prev.map((st) => {
              const orig = strokeStarts[st.id];
              if (orig) {
                return {
                  ...st,
                  points: orig.map((p) => ({
                    x: Number((p.x + deltaX).toFixed(1)),
                    y: Number((p.y + deltaY).toFixed(1)),
                  })),
                };
              }
              return st;
            })
          );
        }
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [zoom, pushHistorySnapshot]
  );

  // Create a new Text Box at specified world coordinates
  const createTextBoxAt = useCallback((worldX: number, worldY: number) => {
    pushHistorySnapshot();
    const maxZ = Math.max(...itemsRef.current.map((i) => i.zIndex), 0) + 1;
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
    setSelectedItemIds([newItem.id]);
    showToast('New text box opened');
  }, [pushHistorySnapshot]);

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
    pushHistorySnapshot();
    const center = getViewCenterWorld();
    const maxZ = Math.max(...itemsRef.current.map((i) => i.zIndex), 0) + 1;

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
    setSelectedItemIds([newItem.id]);
    showToast(`Added ${data.type} to canvas`);
  };

  // Add Shape Item (rectangle, circle, line, arrow)
  const handleAddShape = (kind: ShapeKind, customX?: number, customY?: number) => {
    pushHistorySnapshot();
    const center = getViewCenterWorld();
    const maxZ = Math.max(...itemsRef.current.map((i) => i.zIndex), 0) + 1;

    let width = 200;
    let height = 140;
    if (kind === 'circle') {
      width = 160;
      height = 160;
    } else if (kind === 'line' || kind === 'arrow') {
      width = 200;
      height = 40;
    }

    const newShape: CanvasItem = {
      id: `shape-${kind}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'shape',
      shapeKind: kind,
      x: customX !== undefined ? customX : Math.round(center.x - width / 2),
      y: customY !== undefined ? customY : Math.round(center.y - height / 2),
      width,
      height,
      strokeColor: shapeColor,
      fillColor: 'transparent',
      strokeWidth: penWidth || 3,
      zIndex: maxZ,
      createdAt: Date.now(),
    };

    setItems((prev) => [...prev, newShape]);
    setSelectedItemIds([newShape.id]);
    showToast(`Added ${kind} to canvas`);
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

    // Hand tool active, Middle mouse button, or Spacebar held -> Pan canvas
    if (activeTool === 'hand' || isMiddleButton || isSpacePressed.current) {
      isPanning.current = true;
      panStart.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
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
      setSelectedItemIds([]);
      setSelectedStrokeIds([]);
      return;
    }

    // Eraser tool active -> Click or start dragging to erase strokes
    if (activeTool === 'eraser' && isLeftButton) {
      pushHistorySnapshot();
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
      setSelectedItemIds([]);
      setSelectedStrokeIds([]);
      return;
    }

    // Select tool active -> Dragging on empty canvas immediately activates marquee box selection!
    if (activeTool === 'select' && isLeftButton) {
      const clickedOnCard = (e.target as HTMLElement).closest('.group');
      if (!clickedOnCard) {
        setSelectedConnectorId(null);
        if (!e.shiftKey) {
          setSelectedItemIds([]);
          setSelectedStrokeIds([]);
        }

        isMarqueeSelecting.current = true;
        isPanning.current = false;

        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        const worldX = (e.clientX - pan.x) / zoom;
        const worldY = (e.clientY - pan.y) / zoom;
        marqueeStartRef.current = { x: worldX, y: worldY };
        setMarqueeBox({
          startX: worldX,
          startY: worldY,
          currentX: worldX,
          currentY: worldY,
        });
        return;
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 0. Marquee selection (in Select tool)
    if (isMarqueeSelecting.current) {
      const worldX = (e.clientX - pan.x) / zoom;
      const worldY = (e.clientY - pan.y) / zoom;
      const startX = marqueeStartRef.current.x;
      const startY = marqueeStartRef.current.y;

      setMarqueeBox({
        startX,
        startY,
        currentX: worldX,
        currentY: worldY,
      });

      const minX = Math.min(startX, worldX);
      const maxX = Math.max(startX, worldX);
      const minY = Math.min(startY, worldY);
      const maxY = Math.max(startY, worldY);

      if (maxX - minX > 2 || maxY - minY > 2) {
        const matches = itemsRef.current
          .filter((item) => {
            const itemR = item.x + item.width;
            const itemB = item.y + item.height;
            return (
              item.x <= maxX &&
              itemR >= minX &&
              item.y <= maxY &&
              itemB >= minY
            );
          })
          .map((item) => item.id);

        const strokeMatches = strokesRef.current
          .filter((stroke) => {
            const b = getStrokeBounds(stroke.points, stroke.width);
            return (
              b.minX <= maxX &&
              b.maxX >= minX &&
              b.minY <= maxY &&
              b.maxY >= minY
            );
          })
          .map((stroke) => stroke.id);

        setSelectedItemIds(matches);
        setSelectedStrokeIds(strokeMatches);
      }
      return;
    }

    // 1. Panning canvas (in Hand tool, Spacebar+drag, or Middle button)
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

    if (isMarqueeSelecting.current) {
      isMarqueeSelecting.current = false;
      const box = marqueeBox;
      if (box && Math.abs(box.currentX - box.startX) < 4 && Math.abs(box.currentY - box.startY) < 4) {
        setSelectedItemIds([]);
        setSelectedStrokeIds([]);
        setSelectedConnectorId(null);
      }
      setMarqueeBox(null);
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
        pushHistorySnapshot();
        setStrokes((prev) => [...prev, finalStroke]);
      }
    }
  };

  // Safety listener: if pointer is released anywhere outside canvas
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      isPanning.current = false;
      isErasing.current = false;
      if (isMarqueeSelecting.current) {
        isMarqueeSelecting.current = false;
        setMarqueeBox(null);
      }
      if (isDrawing.current && currentStrokeRef.current) {
        isDrawing.current = false;
        const finalStroke = currentStrokeRef.current;
        currentStrokeRef.current = null;
        setCurrentStroke(null);
        if (finalStroke && finalStroke.points.length > 0) {
          pushHistorySnapshot();
          setStrokes((prev) => [...prev, finalStroke]);
        }
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [pushHistorySnapshot]);

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

  // Keyboard shortcuts (Ctrl+K for AI Agent, Ctrl+Z/Y for Undo/Redo, Spacebar for pan, V for select, H for hand, P for pen, Delete to remove selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {


      // Undo shortcut: Ctrl+Z or Cmd+Z (without Shift)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo shortcut: Ctrl+Y or Cmd+Y, or Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || e.key === 'Y' || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // If user is typing in an input or textarea, don't trigger canvas tool keys
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        isSpacePressed.current = true;
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('hand');
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool('pen');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('eraser');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTool('shape');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedConnectorId) {
          handleRemoveConnector(selectedConnectorId);
        } else if (selectedItemIds.length > 0 || selectedStrokeIds.length > 0) {
          handleRemoveSelectedItems();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
        if (isPanning.current && activeTool !== 'hand') {
          isPanning.current = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedItemIds, selectedStrokeIds, selectedConnectorId, handleRemoveSelectedItems, handleRemoveConnector, handleUndo, handleRedo, activeTool]);

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
            shapeColor={shapeColor}
            setShapeColor={setShapeColor}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onAddTextBox={handleAddTextBoxFromToolbar}
            onOpenUploadModal={(type) => setUploadModalType(type)}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
            onOpenCloudinaryModal={() => setIsCloudinaryModalOpen(true)}
            onAddShape={handleAddShape}
            onClearCanvas={() => {
              pushHistorySnapshot();
              setItems([]);
              setConnectors([]);
            }}
            onDimensionsChange={setToolbarDims}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
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
            connectors={connectors}
            viewport={{ x: pan.x, y: pan.y, scale: zoom }}
            onImportState={(newState) => {
              pushHistorySnapshot();
              setItems(newState.items);
              setStrokes(newState.strokes || []);
              setConnectors(newState.connectors || []);
              setSelectedItemIds([]);
              setSelectedStrokeIds([]);
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
              pushHistorySnapshot();
              setItems([]);
              setStrokes([]);
              setConnectors([]);
              setSelectedItemIds([]);
              setSelectedStrokeIds([]);
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

          {/* Multi-selection pill badge */}
          {selectedItemIds.length + selectedStrokeIds.length > 1 && !marqueeBox && (
            <div
              className={`fixed top-5 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full border shadow-2xl backdrop-blur-md text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
                theme === 'light'
                  ? 'bg-white/95 border-blue-400 text-blue-900 shadow-blue-500/10'
                  : 'bg-[#201b1b]/95 border-blue-500/50 text-blue-300 shadow-black/80'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{selectedItemIds.length + selectedStrokeIds.length} items selected</span>
              <span className="opacity-40">•</span>
              <span className="opacity-75 text-[11px]">Drag any to move together</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedItemIds([]);
                  setSelectedStrokeIds([]);
                }}
                className="ml-1 text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer"
              >
                Deselect
              </button>
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
          activeTool === 'hand'
            ? isPanning.current
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : activeTool === 'pen' || activeTool === 'eraser'
            ? 'cursor-crosshair'
            : isMarqueeSelecting.current
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
          {/* Marquee Selection Rectangle (double click & drag) */}
          {marqueeBox && (
            <div
              className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500/15 rounded-sm z-[1000]"
              style={{
                left: `${Math.min(marqueeBox.startX, marqueeBox.currentX)}px`,
                top: `${Math.min(marqueeBox.startY, marqueeBox.currentY)}px`,
                width: `${Math.abs(marqueeBox.currentX - marqueeBox.startX)}px`,
                height: `${Math.abs(marqueeBox.currentY - marqueeBox.startY)}px`,
              }}
            />
          )}

          {/* Smart Connectors Layer (Anchored Arrows) */}
          <ConnectorLayer
            items={items}
            connectors={connectors}
            zoom={zoom}
            selectedConnectorId={selectedConnectorId}
            onSelectConnector={(id) => {
              setSelectedConnectorId(id);
              if (id) setSelectedItemIds([]);
            }}
            onUpdateConnector={handleUpdateConnector}
            onRemoveConnector={handleRemoveConnector}
            onStartDragEndpoint={handleStartDragEndpoint}
            draftConnector={
              connectingDraft
                ? {
                    from: { itemId: connectingDraft.fromItem.id, side: connectingDraft.fromSide },
                    to: connectingDraft.currentPos,
                    color: '#3b82f6',
                    hasArrow: true,
                    style: 'orthogonal',
                  }
                : null
            }
            snappedAnchor={
              snappedAnchor
                ? (() => {
                    const item = items.find((it) => it.id === snappedAnchor.itemId);
                    if (!item) return null;
                    return {
                      itemId: snappedAnchor.itemId,
                      side: snappedAnchor.side,
                      position: getAnchorPosition(item, snappedAnchor.side),
                    };
                  })()
                : null
            }
            theme={theme}
          />

          {/* Render Canvas Items */}
          {items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const commonProps = {
              item,
              zoom,
              isSelected,
              theme,
              isPenActive: activeTool === 'pen' || activeTool === 'eraser' || activeTool === 'hand',
              onSelect: handleSelectItem,
              onUpdate: handleUpdateItem,
              onDragStart: handleDragStartItem,
              onDragMove: handleDragMoveItem,
              onRemove: handleRemoveItem,
              onStartConnect: handleStartConnect,
              isConnecting: Boolean(connectingDraft),
              snappedSide: snappedAnchor?.itemId === item.id ? snappedAnchor.side : null,
            };

            if (item.type === 'shape') {
              return <ShapeItem key={item.id} {...commonProps} />;
            }
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
          activeTool={activeTool}
          selectedStrokeIds={selectedStrokeIds}
          onStrokePointerDown={handleStrokePointerDown}
        />
      </div>
    </CanvasFrame>
  );
}
