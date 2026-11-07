'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CanvasItem, AnchorSide } from '@/types/canvas';
import CanvasItemCard from './CanvasItemCard';

interface TextBoxItemProps {
  theme?: 'dark' | 'light';
  isPenActive?: boolean;
  item: CanvasItem;
  zoom: number;
  isSelected: boolean;
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  onDragStart?: (id: string) => void;
  onDragMove?: (id: string, deltaX: number, deltaY: number) => void;
  onRemove: (id: string) => void;
  onStartConnect?: (itemId: string, side: AnchorSide, e: React.MouseEvent) => void;
  isConnecting?: boolean;
  snappedSide?: AnchorSide | null;
}

export default function TextBoxItem({
  theme = 'dark',
  isPenActive = false,
  item,
  zoom,
  isSelected,
  onSelect,
  onUpdate,
  onDragStart,
  onDragMove,
  onRemove,
  onStartConnect,
  isConnecting,
  snappedSide,
}: TextBoxItemProps) {
  // If item was just created (within 2 seconds and content is empty), start in edit mode
  const [isEditing, setIsEditing] = useState(() => {
    return Date.now() - (item.createdAt || 0) < 2000 && !item.content;
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When card loses selection/focus, exit edit mode
  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);

  // When entering edit mode, focus textarea and place cursor at end
  useEffect(() => {
    if (isEditing && isSelected && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing, isSelected]);

  // Clicking twice (double click) when not active/editing activates edit mode
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);
    setIsEditing(true);
  };

  return (
    <CanvasItemCard
      theme={theme}
      isPenActive={isPenActive}
      item={item}
      zoom={zoom}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onRemove={onRemove}
      onStartConnect={onStartConnect}
      isConnecting={isConnecting}
      snappedSide={snappedSide}
    >
      <div
        onDoubleClick={handleDoubleClick}
        className={`w-full h-full flex flex-col p-3 rounded-xl select-none transition-colors duration-150 ${
          theme === 'light' ? 'bg-[#f4efe8]' : 'bg-[#d8dade]'
        }`}
      >
        {isEditing && isSelected ? (
          <textarea
            ref={textareaRef}
            value={item.content || ''}
            placeholder="Type text here..."
            onChange={(e) => onUpdate(item.id, { content: e.target.value })}
            onBlur={() => setIsEditing(false)}
            style={{
              fontSize: `${item.fontSize || 14}px`,
            }}
            className="w-full flex-1 bg-transparent resize-none outline-none border-none text-black font-sans placeholder-black/40 leading-relaxed overflow-y-auto selection:bg-neutral-800 selection:text-white select-text"
          />
        ) : (
          <div
            className="w-full flex-1 overflow-y-auto whitespace-pre-wrap break-words text-black font-sans leading-relaxed cursor-default"
            style={{ fontSize: `${item.fontSize || 14}px` }}
          >
            {item.content || (
              <span className="text-black/40 italic">Double-click to edit text</span>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-black/40 pt-1 border-t border-black/10 select-none">
          <span>{item.content ? `${item.content.length} characters` : 'Text note'}</span>
          <span className="text-[10px] text-black/50">
            {isEditing && isSelected ? 'Editing' : 'Double-click to edit'}
          </span>
        </div>
      </div>
    </CanvasItemCard>
  );
}
