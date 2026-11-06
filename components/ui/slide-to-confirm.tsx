"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "motion/react";
import { ChevronsRight, Check } from "@honeyicons/react";
import { cn } from "@/lib/utils";

export interface SlideToConfirmProps {
  text?: string;
  confirmedText?: string;
  onConfirm?: () => void | Promise<void>;
  onReset?: () => void;
  isConfirmed?: boolean;
  disabled?: boolean;
  className?: string;
  theme?: "dark" | "light";
  variant?: "default" | "destructive";
}

export function SlideToConfirm({
  text = "Slide to confirm",
  confirmedText = "Confirmed",
  onConfirm,
  onReset,
  isConfirmed: controlledIsConfirmed,
  disabled = false,
  className,
  theme = "dark",
  variant = "destructive",
}: SlideToConfirmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [internalConfirmed, setInternalConfirmed] = useState(false);
  const [maxDragDistance, setMaxDragDistance] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  const isConfirmed = controlledIsConfirmed ?? internalConfirmed;
  const isLight = theme === "light";
  const isDestructive = variant === "destructive";

  const x = useMotionValue(0);

  const THUMB_SIZE = 44;
  const PADDING = 4;

  const updateDragDistance = useCallback(() => {
    if (containerRef.current && handleRef.current) {
      const cw = containerRef.current.clientWidth;
      const hw = handleRef.current.clientWidth;
      const distance = Math.max(1, cw - hw - PADDING * 2);
      setMaxDragDistance(distance);
      setContainerWidth(cw);
      if (isConfirmed && distance > 0) x.set(distance);
    }
  }, [isConfirmed, x]);

  useEffect(() => {
    updateDragDistance();
    window.addEventListener("resize", updateDragDistance);
    return () => window.removeEventListener("resize", updateDragDistance);
  }, [updateDragDistance]);

  useEffect(() => {
    if (isConfirmed && maxDragDistance > 0) {
      animate(x, maxDragDistance, { type: "spring", stiffness: 400, damping: 35 });
    } else if (!isConfirmed) {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
    }
  }, [isConfirmed, maxDragDistance, x]);

  // Fill starts at thumb width and grows rightward as thumb moves
  const fillWidth = useTransform(
    x,
    [0, maxDragDistance],
    [THUMB_SIZE + PADDING * 2, containerWidth - PADDING * 2]
  );

  const textOpacity = useTransform(x, [0, maxDragDistance * 0.55], [1, 0]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (disabled || isConfirmed) return;
    const currentX = x.get();
    if (currentX >= maxDragDistance * 0.85) {
      animate(x, maxDragDistance, { type: "spring", stiffness: 400, damping: 35 });
      setInternalConfirmed(true);
      try {
        await onConfirm?.();
      } catch {
        setInternalConfirmed(false);
        animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
      }
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  const handleReset = () => {
    setInternalConfirmed(false);
    animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
    onReset?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center h-13 p-1 rounded-md select-none overflow-hidden touch-none transition-colors",
        isDestructive
          ? isLight
            ? "bg-red-50 border border-red-200"
            : "bg-[#281c1c] border border-[#522929]"
          : isLight
          ? "bg-zinc-100 border border-zinc-200"
          : "bg-zinc-900 border border-zinc-800",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Fill — anchored LEFT, expands rightward from the thumb side */}
      <motion.div
        className={cn(
          "absolute left-1 top-1 bottom-1 z-0 rounded-md",
          isDestructive
            ? isLight
              ? "bg-red-500/15"
              : "bg-red-500/25"
            : isLight
            ? "bg-black/10"
            : "bg-white/20"
        )}
        style={{ width: fillWidth }}
      />

      {/* Label text */}
      <motion.span
        style={{ opacity: isConfirmed ? 0 : textOpacity }}
        className={cn(
          "absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-wider uppercase pointer-events-none z-10",
          isDestructive
            ? isLight
              ? "text-red-700/70"
              : "text-red-300/70"
            : isLight
            ? "text-zinc-500"
            : "text-zinc-400"
        )}
      >
        {text}
      </motion.span>

      {/* Confirmed label */}
      {isConfirmed && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleReset}
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-wider cursor-pointer z-10 gap-2",
            isDestructive
              ? isLight
                ? "text-red-600"
                : "text-red-400"
              : isLight
              ? "text-black"
              : "text-white"
          )}
        >
          {confirmedText}
        </motion.span>
      )}

      {/* Draggable thumb */}
      <motion.div
        ref={handleRef}
        drag={disabled || isConfirmed ? false : "x"}
        dragConstraints={{ left: 0, right: maxDragDistance }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileHover={disabled || isConfirmed ? {} : { scale: 1.05 }}
        whileTap={disabled || isConfirmed ? {} : { scale: 0.96 }}
        className={cn(
          "relative z-20 flex items-center justify-center w-11 h-11 rounded-md cursor-grab active:cursor-grabbing shadow-md transition-shadow",
          isDestructive
            ? "bg-red-600 text-white shadow-red-950/40"
            : isLight
            ? "bg-black text-white hover:bg-zinc-800"
            : "bg-white text-black hover:bg-zinc-200"
        )}
      >
        {isConfirmed ? (
          <Check size={20} />
        ) : (
          <ChevronsRight size={20} />
        )}
      </motion.div>
    </div>
  );
}

export default SlideToConfirm;
