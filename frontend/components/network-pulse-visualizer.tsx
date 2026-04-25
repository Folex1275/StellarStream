"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Pulse {
  id: string;
  lane: number;
  progress: number;
  timestamp: number;
}

interface NetworkPulseVisualizerProps {
  /** Number of parallel lanes to show (default: 4) */
  laneCount?: number;
  /** Whether to show active transaction processing */
  isProcessing?: boolean;
  /** Size of the visualizer in pixels */
  size?: number;
}

export default function NetworkPulseVisualizer({
  laneCount = 4,
  isProcessing = true,
  size = 120,
}: NetworkPulseVisualizerProps) {
  const [pulses, setPulses] = useState<Pulse[]>([]);

  // Generate new pulses when processing
  useEffect(() => {
    if (!isProcessing) {
      setPulses([]);
      return;
    }

    const interval = setInterval(() => {
      const lane = Math.floor(Math.random() * laneCount);
      const newPulse: Pulse = {
        id: `${Date.now()}-${Math.random()}`,
        lane,
        progress: 0,
        timestamp: Date.now(),
      };

      setPulses((prev) => {
        // Limit to prevent overcrowding
        const updated = [...prev, newPulse];
        return updated.length > laneCount * 2 ? updated.slice(-laneCount) : updated;
      });
    }, 800 + Math.random() * 400); // Random interval between 800-1200ms

    return () => clearInterval(interval);
  }, [isProcessing, laneCount]);

  // Animate pulses across lanes
  useEffect(() => {
    const animationFrame = setInterval(() => {
      setPulses((prev) =>
        prev.map((pulse) => ({
          ...pulse,
          progress: Math.min(pulse.progress + 0.02, 1), // Move 2% per frame
        }))
      );
    }, 16); // ~60fps

    return () => clearInterval(animationFrame);
  }, []);

  // Clean up completed pulses
  useEffect(() => {
    const cleanup = setInterval(() => {
      setPulses((prev) => prev.filter((pulse) => pulse.progress < 1));
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <div
      className="network-pulse-visualizer"
      style={{
        width: size,
        height: size * 0.75,
        position: "relative",
        overflow: "hidden",
      }}
      role="img"
      aria-label="Network pulse visualizer showing parallel transaction processing"
    >
      <style>{`
        .lane-grid {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 4px;
        }

        .lane {
          flex: 1;
          position: relative;
          background: rgba(0,229,255,0.1);
          border-radius: 1px;
          border: 1px solid rgba(0,229,255,0.2);
          overflow: hidden;
        }

        .lane::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(0,229,255,0.3) 50%,
            transparent 100%
          );
          animation: laneGlow 3s ease-in-out infinite;
        }

        @keyframes laneGlow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }

        .pulse-trail {
          position: absolute;
          height: 100%;
          width: 20px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(0,229,255,0.8) 30%,
            rgba(138,43,226,0.6) 70%,
            transparent 100%
          );
          border-radius: 2px;
          box-shadow: 0 0 8px rgba(0,229,255,0.6);
        }
      `}</style>

      <div className="lane-grid">
        {Array.from({ length: laneCount }, (_, i) => (
          <div key={i} className="lane">
            <AnimatePresence mode="popLayout">
              {pulses
                .filter((pulse) => pulse.lane === i)
                .map((pulse) => (
                  <motion.div
                    key={pulse.id}
                    className="pulse-trail"
                    initial={{ x: "-20px", opacity: 0 }}
                    animate={{
                      x: `${pulse.progress * 100}%`,
                      opacity: pulse.progress < 0.1 ? pulse.progress * 10 : 1,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.1,
                      ease: "linear",
                    }}
                    style={{
                      left: `${pulse.progress * 100}%`,
                    }}
                  />
                ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Protocol indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "2px",
          right: "4px",
          fontSize: "8px",
          color: "rgba(0,229,255,0.7)",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: "500",
        }}
      >
        P23
      </div>
    </div>
  );
}