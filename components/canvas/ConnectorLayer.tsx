'use client';

import React, { useState } from 'react';
import { CanvasConnector, CanvasItem, AnchorSide } from '@/types/canvas';
import { resolveEndpoint, getConnectorPath, computeConnectorJoints } from '@/lib/connectorUtils';

interface DraftConnector {
  from: { itemId: string; side: AnchorSide } | { x: number; y: number };
  to: { itemId: string; side: AnchorSide } | { x: number; y: number };
  color: string;
  hasArrow?: boolean;
  style?: 'orthogonal' | 'curved' | 'straight';
}

interface ConnectorLayerProps {
  connectors: CanvasConnector[];
  items: CanvasItem[];
  zoom: number;
  selectedConnectorId: string | null;
  onSelectConnector: (id: string | null) => void;
  onUpdateConnector: (id: string, updates: Partial<CanvasConnector>) => void;
  onRemoveConnector: (id: string) => void;
  draftConnector: DraftConnector | null;
  snappedAnchor: { itemId: string; side: AnchorSide; position: { x: number; y: number } } | null;
  theme?: 'dark' | 'light';
  onStartDragEndpoint?: (connectorId: string, end: 'from' | 'to', e: React.MouseEvent) => void;
}

export default function ConnectorLayer({
  connectors,
  items,
  zoom,
  selectedConnectorId,
  onSelectConnector,
  onUpdateConnector,
  onRemoveConnector,
  draftConnector,
  snappedAnchor,
  theme = 'dark',
  onStartDragEndpoint,
}: ConnectorLayerProps) {
  const isLight = theme === 'light';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Dragging an interactive joint handle along the connector
  const handleStartDragJoint = (
    connector: CanvasConnector,
    jointIdx: number,
    currentJoints: { x: number; y: number }[],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const originalJoints = currentJoints.map((pt) => ({ ...pt }));

    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = (moveEv.clientX - startClientX) / zoom;
      const deltaY = (moveEv.clientY - startClientY) / zoom;

      const updated = originalJoints.map((pt, idx) => {
        if (idx === jointIdx) {
          return {
            x: Math.round(pt.x + deltaX),
            y: Math.round(pt.y + deltaY),
          };
        }
        return pt;
      });

      onUpdateConnector(connector.id, { waypoints: updated });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Double click joint to remove it
  const handleRemoveJoint = (connector: CanvasConnector, jointIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!connector.waypoints || connector.waypoints.length === 0) return;
    const updated = connector.waypoints.filter((_, idx) => idx !== jointIdx);
    onUpdateConnector(connector.id, { waypoints: updated.length > 0 ? updated : undefined });
  };

  // Add a new flexible joint at a specific position
  const handleAddJoint = (connector: CanvasConnector, newJoint: { x: number; y: number }, atIndex?: number) => {
    const current = connector.waypoints ? [...connector.waypoints] : [];
    if (atIndex !== undefined) {
      current.splice(atIndex, 0, newJoint);
    } else {
      current.push(newJoint);
    }
    onUpdateConnector(connector.id, { waypoints: current });
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <defs>
        {/* Open chevron "V" arrowheads matching reference image with rounded caps */}
        {connectors.map((c) => {
          const color = c.color || (isLight ? '#2563eb' : '#3b82f6');
          const sw = c.strokeWidth || 2.5;
          const markerId = `arrowhead-${c.id}`;
          return (
            <marker
              key={markerId}
              id={markerId}
              markerWidth="16"
              markerHeight="16"
              refX="11.5"
              refY="8"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path
                d="M 4 3 L 11.5 8 L 4 13"
                fill="none"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          );
        })}

        {/* Draft marker (open chevron V) */}
        <marker
          id="arrowhead-draft"
          markerWidth="16"
          markerHeight="16"
          refX="11.5"
          refY="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 4 3 L 11.5 8 L 4 13"
            fill="none"
            stroke={draftConnector?.color || '#2563eb'}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {/* Render existing connectors */}
      {connectors.map((connector) => {
        const fromResolved = resolveEndpoint(connector.from, items);
        const toResolved = resolveEndpoint(connector.to, items);

        // If either item was deleted and cannot be resolved, skip rendering
        if (!fromResolved || !toResolved) return null;

        const isSelected = selectedConnectorId === connector.id;
        const isHovered = hoveredId === connector.id;
        const color = connector.color || (isLight ? '#2563eb' : '#3b82f6');
        const sw = connector.strokeWidth || 2.5;
        const style = connector.style || 'orthogonal';
        const cornerStyle = connector.cornerStyle || 'rounded';
        const hasArrow = connector.hasArrow !== false;

        const pathD = getConnectorPath(
          fromResolved.position,
          toResolved.position,
          fromResolved.side,
          toResolved.side,
          style,
          14,
          connector.waypoints,
          cornerStyle
        );

        const joints = computeConnectorJoints(
          fromResolved.position,
          toResolved.position,
          fromResolved.side,
          toResolved.side,
          style,
          connector.waypoints
        );

        // Midpoint for floating control pill
        const midX = (fromResolved.position.x + toResolved.position.x) / 2;
        const midY = (fromResolved.position.y + toResolved.position.y) / 2;

        return (
          <g key={connector.id} className="pointer-events-auto">
            {/* Invisible thick stroke for effortless click & hover */}
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(20 / zoom, 16)}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredId(connector.id)}
              onMouseLeave={() => setHoveredId((cur) => (cur === connector.id ? null : cur))}
              onClick={(e) => {
                e.stopPropagation();
                onSelectConnector(connector.id);
              }}
            />

            {/* Glowing selection / hover halo */}
            {(isSelected || isHovered) && (
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={sw + (isSelected ? 6 : 3)}
                strokeOpacity={isSelected ? 0.35 : 0.2}
                strokeLinecap="round"
                className="pointer-events-none transition-all duration-150"
              />
            )}

            {/* Visible connector path */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              strokeLinecap="round"
              markerEnd={hasArrow ? `url(#arrowhead-${connector.id})` : undefined}
              className="pointer-events-none transition-colors duration-150"
            />

            {/* Endpoint handles and Draggable Joints when selected */}
            {isSelected && (
              <>
                {/* Start handle */}
                <circle
                  cx={fromResolved.position.x}
                  cy={fromResolved.position.y}
                  r={5}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth={2}
                  className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform shadow-md"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onStartDragEndpoint?.(connector.id, 'from', e);
                  }}
                >
                  <title>Drag to reconnect start point</title>
                </circle>

                {/* End handle */}
                <circle
                  cx={toResolved.position.x}
                  cy={toResolved.position.y}
                  r={5}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth={2}
                  className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform shadow-md"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onStartDragEndpoint?.(connector.id, 'to', e);
                  }}
                >
                  <title>Drag to reconnect arrow tip</title>
                </circle>

                {/* Draggable Flexible Bend Joints */}
                {joints.map((joint, idx) => (
                  <g key={`joint-${connector.id}-${idx}`} className="pointer-events-auto">
                    {/* Invisible hit padding */}
                    <circle
                      cx={joint.x}
                      cy={joint.y}
                      r={11}
                      fill="transparent"
                      className="cursor-move"
                      onMouseDown={(e) => handleStartDragJoint(connector, idx, joints, e)}
                      onDoubleClick={(e) => handleRemoveJoint(connector, idx, e)}
                    >
                      <title>Drag joint to bend • Double-click to remove joint</title>
                    </circle>
                    {/* Visual handle dot */}
                    <circle
                      cx={joint.x}
                      cy={joint.y}
                      r={4.5}
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth={2}
                      className="pointer-events-none shadow-sm hover:scale-125 transition-transform"
                    />
                    <circle
                      cx={joint.x}
                      cy={joint.y}
                      r={1.8}
                      fill={color}
                      className="pointer-events-none"
                    />
                  </g>
                ))}

                {/* Floating Action Pill at midpoint */}
                <foreignObject
                  x={midX - 145}
                  y={midY - 40}
                  width={290}
                  height={36}
                  className="overflow-visible pointer-events-auto"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full shadow-2xl text-[10px] font-medium backdrop-blur-md border animate-in fade-in duration-150 select-none ${
                      isLight
                        ? 'bg-white/95 border-[#d8cfcf] text-[#2d2424] shadow-black/10'
                        : 'bg-[#231b1b]/95 border-[#524141] text-white shadow-black/80'
                    }`}
                  >
                    {/* Color picker */}
                    <label
                      title={`Change connector color (Current: ${color})`}
                      className="relative flex items-center cursor-pointer hover:scale-110 transition-transform"
                    >
                      <span
                        style={{ backgroundColor: color }}
                        className="w-3.5 h-3.5 rounded-full border border-black/30 dark:border-white/40 shadow-xs"
                      />
                      <input
                        type="color"
                        value={color.startsWith('#') ? color : '#2563eb'}
                        onChange={(e) => onUpdateConnector(connector.id, { color: e.target.value })}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>

                    {/* Style toggle (Elbow vs Curved vs Straight) */}
                    <button
                      type="button"
                      title={`Current style: ${style}. Click to cycle style.`}
                      onClick={() => {
                        const nextStyle =
                          style === 'orthogonal'
                            ? 'curved'
                            : style === 'curved'
                            ? 'straight'
                            : 'orthogonal';
                        onUpdateConnector(connector.id, { style: nextStyle });
                      }}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {style === 'orthogonal' ? 'Elbow' : style === 'curved' ? 'Curve' : 'Line'}
                    </button>

                    {/* Joint Corner Style option (Rounded vs Sharp 90°) */}
                    {style === 'orthogonal' && (
                      <button
                        type="button"
                        title={
                          cornerStyle === 'rounded'
                            ? 'Switch to sharp 90° joints'
                            : 'Switch to rounded radius joints'
                        }
                        onClick={() =>
                          onUpdateConnector(connector.id, {
                            cornerStyle: cornerStyle === 'rounded' ? 'sharp' : 'rounded',
                          })
                        }
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                          cornerStyle === 'rounded' ? 'text-blue-500 font-semibold' : ''
                        }`}
                      >
                        {cornerStyle === 'rounded' ? 'Rounded' : 'Sharp'}
                      </button>
                    )}

                    {/* Add Flexible Joint button */}
                    <button
                      type="button"
                      title="Add a flexible bend joint to arrow"
                      onClick={() =>
                        handleAddJoint(connector, {
                          x: Math.round(midX),
                          y: Math.round(midY),
                        })
                      }
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono hover:bg-black/5 dark:hover:bg-white/10 text-blue-500 font-bold transition-colors cursor-pointer"
                    >
                      + Joint
                    </button>

                    {/* Reset custom waypoints */}
                    {Boolean(connector.waypoints && connector.waypoints.length > 0) && (
                      <button
                        type="button"
                        title="Reset custom joints to auto-route"
                        onClick={() => onUpdateConnector(connector.id, { waypoints: undefined })}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}

                    {/* Arrow toggle */}
                    <button
                      type="button"
                      title={hasArrow ? 'Remove arrowhead' : 'Add arrowhead'}
                      onClick={() => onUpdateConnector(connector.id, { hasArrow: !hasArrow })}
                      className={`px-1 py-0.5 rounded text-[9px] font-mono hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                        hasArrow ? 'text-blue-500 font-bold' : 'opacity-60'
                      }`}
                    >
                      →
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      title="Delete connector"
                      onClick={() => {
                        onRemoveConnector(connector.id);
                        onSelectConnector(null);
                      }}
                      className="text-red-400 hover:text-red-500 p-0.5 rounded hover:bg-red-500/10 cursor-pointer transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </foreignObject>
              </>
            )}
          </g>
        );
      })}

      {/* Render live stretching draft connector during drag */}
      {draftConnector && (() => {
        const fromResolved = resolveEndpoint(draftConnector.from, items);
        const toResolved = resolveEndpoint(draftConnector.to, items);

        if (!fromResolved || !toResolved) return null;

        const color = draftConnector.color || '#2563eb';
        const pathD = getConnectorPath(
          fromResolved.position,
          toResolved.position,
          fromResolved.side,
          toResolved.side,
          draftConnector.style || 'orthogonal'
        );

        return (
          <g className="pointer-events-none">
            {/* Subtle glow under live draft line */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={5}
              strokeOpacity={0.25}
              strokeLinecap="round"
            />
            {/* Live draft line */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeDasharray="5,4"
              strokeLinecap="round"
              markerEnd="url(#arrowhead-draft)"
            />
            {/* Source origin dot */}
            <circle
              cx={fromResolved.position.x}
              cy={fromResolved.position.y}
              r={4}
              fill={color}
            />
          </g>
        );
      })()}

      {/* Snapped magnetic target indicator dot */}
      {snappedAnchor && (
        <g className="pointer-events-none animate-in fade-in duration-100">
          <circle
            cx={snappedAnchor.position.x}
            cy={snappedAnchor.position.y}
            r={7}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
          />
          <circle
            cx={snappedAnchor.position.x}
            cy={snappedAnchor.position.y}
            r={3}
            fill="#2563eb"
          />
        </g>
      )}
    </svg>
  );
}
