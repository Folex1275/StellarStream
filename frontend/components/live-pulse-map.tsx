"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Pulse {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

export default function LivePulseMap() {
  const [pulses, setPulses] = useState<Pulse[]>([]);

  // Generate new pulse
  useEffect(() => {
    const interval = setInterval(() => {
      const newPulse: Pulse = {
        id: `${Date.now()}-${Math.random()}`,
        x: Math.random() * 100,
        y: 20 + Math.random() * 60,
        timestamp: Date.now(),
      };
      setPulses((prev: Pulse[]) => {
        // Limit array size to prevent memory leak
        const updated = [...prev, newPulse];
        return updated.length > 10 ? updated.slice(-10) : updated;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Clean up old pulses
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setPulses((prev: Pulse[]) => prev.filter((p: Pulse) => now - p.timestamp < 3000));
    }, 500);

    return () => {
      clearInterval(cleanup);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&display=swap');

        .pulse-card {
          position: relative;
          width: 360px;
          height: 200px;
          border-radius: 16px;
          padding: 18px;
          overflow: hidden;
          color: #e8eaf6;
          font-family: 'Syne', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          background: linear-gradient(180deg, rgba(6,6,15,0.92), rgba(10,10,20,0.88));
          border: 1px solid rgba(255,255,255,0.04);
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .pulse-card {
            background: linear-gradient(180deg, rgba(6,6,15,0.7), rgba(10,10,20,0.65));
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .map-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.3;
        }

        .world-map {
          width: 90%;
          height: auto;
          filter: drop-shadow(0 0 8px rgba(0,229,255,0.2));
        }

        .pulse-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .pulse-title {
          position: relative;
          z-index: 2;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.02em;
          background: linear-gradient(90deg, #00e5ff, #8a2be2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .pulse-subtitle {
          position: relative;
          z-index: 2;
          font-size: 12px;
          color: rgba(232,234,246,0.65);
          margin-top: 6px;
        }

        .pulse-stats {
          position: absolute;
          bottom: 18px;
          left: 18px;
          z-index: 2;
          font-size: 11px;
          color: rgba(0,229,255,0.7);
        }
      `}</style>

      <div className="pulse-card" role="group" aria-label="Live network activity">
        <div className="map-container" aria-hidden="true">
          <svg className="world-map" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100,200 L150,180 L200,190 L250,170 L300,185 L350,175 L400,180 L450,190 L500,185 L550,195 L600,180 L650,190 L700,185" 
              stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" fill="none"/>
            <path d="M120,220 Q200,240 280,230 T440,235 T600,225 L680,230" 
              stroke="rgba(138,43,226,0.3)" strokeWidth="1.5" fill="none"/>
            <ellipse cx="200" cy="200" rx="40" ry="25" stroke="rgba(0,229,255,0.25)" strokeWidth="1" fill="none"/>
            <ellipse cx="400" cy="190" rx="50" ry="30" stroke="rgba(0,229,255,0.25)" strokeWidth="1" fill="none"/>
            <ellipse cx="600" cy="200" rx="45" ry="28" stroke="rgba(0,229,255,0.25)" strokeWidth="1" fill="none"/>
            <circle cx="180" cy="195" r="2" fill="rgba(0,229,255,0.6)"/>
            <circle cx="420" cy="185" r="2" fill="rgba(0,229,255,0.6)"/>
            <circle cx="580" cy="205" r="2" fill="rgba(0,229,255,0.6)"/>
            <circle cx="320" cy="210" r="1.5" fill="rgba(138,43,226,0.5)"/>
            <circle cx="500" cy="195" r="1.5" fill="rgba(138,43,226,0.5)"/>
          </svg>
        </div>

        <div className="pulse-layer">
          <AnimatePresence mode="popLayout">
            {pulses.map((pulse: Pulse) => (
              <motion.div
                key={pulse.id}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: `${pulse.x}%`,
                  top: `${pulse.y}%`,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: "2px solid #00e5ff",
                  boxShadow: "0 0 12px rgba(0,229,255,0.6)",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        <div>
          <div className="pulse-title">Live Pulse</div>
          <div className="pulse-subtitle">Global stream activity</div>
        </div>

        <div className="pulse-stats">
          {pulses.length} active {pulses.length === 1 ? "pulse" : "pulses"}
        </div>
      </div>
    </>
  );
}
