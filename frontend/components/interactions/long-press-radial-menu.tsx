"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ELASTIC_PRESETS, INTERACTION_TIMINGS, getSpringConfig } from "./elastic-presets";

export interface RadialMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  onSelect: () => void;
}

export interface LongPressRadialMenuProps {
  /** Menu items to display in radial pattern */
  items: RadialMenuItem[];
  /** Content to wrap (e.g., stream card) */
  children: React.ReactNode;
  /** Radius of the radial menu in pixels */
  radius?: number;
  /** Custom long-press threshold in ms */
  longPressThreshold?: number;
  /** Disable the menu */
  disabled?: boolean;
}

/**
 * Long-Press Radial Menu Component
 * 
 * Displays a circular menu of options when user long-presses on the wrapped content.
 * Implements spring physics from Figma prototype (Issue #520).
 * 
 * @example
 * ```tsx
 * <LongPressRadialMenu
 *   items={[
 *     { id: 'withdraw', label: 'Withdraw', onSelect: handleWithdraw },
 *     { id: 'cancel', label: 'Cancel', onSelect: handleCancel },
 *   ]}
 * >
 *   <StreamCard {...streamData} />
 * </LongPressRadialMenu>
 * ```
 */
export default function LongPressRadialMenu({
  items,
  children,
  radius = 120,
  longPressThreshold = INTERACTION_TIMINGS.longPressThreshold,
  disabled = false,
}: LongPressRadialMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const springConfig = getSpringConfig("snappy");

  // Calculate radial positions for menu items
  const getItemPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const handlePressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Get touch/mouse position
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setMenuPosition({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });

      // Start long-press timer
      longPressTimer.current = setTimeout(() => {
        setIsMenuOpen(true);
        // Haptic feedback (if supported)
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
      }, longPressThreshold);
    },
    [disabled, longPressThreshold]
  );

  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isMenuOpen && selectedIndex !== null) {
      items[selectedIndex]?.onSelect();
    }

    setIsMenuOpen(false);
    setSelectedIndex(null);
  }, [isMenuOpen, selectedIndex, items]);

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMenuOpen) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - rect.left - menuPosition.x;
      const dy = clientY - rect.top - menuPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30) {
        setSelectedIndex(null);
        return;
      }

      // Calculate which item is being hovered
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
      const itemAngle = (2 * Math.PI) / items.length;
      const index = Math.floor(normalizedAngle / itemAngle);

      setSelectedIndex(index);
    },
    [isMenuOpen, menuPosition, items.length]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", touchAction: "none" }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseMove={handleMove}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchMove={handleMove}
    >
      {children}

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            style={{
              position: "absolute",
              left: menuPosition.x,
              top: menuPosition.y,
              pointerEvents: "none",
              zIndex: 1000,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", ...springConfig }}
          >
            {/* Center pulse indicator */}
            <motion.div
              style={{
                position: "absolute",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "rgba(0, 245, 255, 0.3)",
                border: "2px solid rgba(0, 245, 255, 0.8)",
                left: -10,
                top: -10,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Radial menu items */}
            {items.map((item, index) => {
              const pos = getItemPosition(index, items.length);
              const isSelected = selectedIndex === index;

              return (
                <motion.div
                  key={item.id}
                  style={{
                    position: "absolute",
                    left: pos.x - 30,
                    top: pos.y - 30,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: item.color || "rgba(0, 245, 255, 0.2)",
                    border: "2px solid rgba(0, 245, 255, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#00f5ff",
                    boxShadow: isSelected
                      ? "0 0 20px rgba(0, 245, 255, 0.8)"
                      : "0 0 10px rgba(0, 245, 255, 0.3)",
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isSelected ? 1.15 : 1,
                    opacity: 1,
                  }}
                  transition={{
                    type: "spring",
                    ...springConfig,
                    delay: index * 0.05,
                  }}
                >
                  {item.icon || item.label}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
