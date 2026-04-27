"use client";

import { useState, useEffect } from "react";

interface EmptyStateProps {
  onCreateStream?: () => void;
}

// ─── 3D Glass Cube via SVG + CSS transforms ───────────────────────────────────
function FloatingGlassCube() {
  return (
    <div className="cube-scene" aria-hidden="true">
      {/* Ambient orbs behind cube */}
      <div className="cube-orb cube-orb-1" />
      <div className="cube-orb cube-orb-2" />

      {/* The CSS 3D cube */}
      <div className="cube-wrapper">
        <div className="cube">
          {/* Top face */}
          <div className="cube-face cube-face--top">
            <div className="face-inner face-inner--top" />
            <div className="face-grid" />
          </div>
          {/* Front face */}
          <div className="cube-face cube-face--front">
            <div className="face-inner face-inner--front" />
            <div className="face-shimmer" />
            <div className="face-content">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="10" stroke="rgba(0,229,255,0.5)" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx="16" cy="16" r="4" fill="rgba(0,229,255,0.4)" />
                <line x1="16" y1="4" x2="16" y2="28" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" />
                <line x1="4" y1="16" x2="28" y2="16" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" />
              </svg>
            </div>
          </div>
          {/* Right face */}
          <div className="cube-face cube-face--right">
            <div className="face-inner face-inner--right" />
            <div className="face-shimmer" style={{ animationDelay: "0.8s" }} />
          </div>
          {/* Left face */}
          <div className="cube-face cube-face--left">
            <div className="face-inner face-inner--left" />
          </div>
          {/* Back face */}
          <div className="cube-face cube-face--back">
            <div className="face-inner face-inner--back" />
          </div>
          {/* Bottom face */}
          <div className="cube-face cube-face--bottom">
            <div className="face-inner face-inner--bottom" />
          </div>
        </div>

        {/* Shadow below */}
        <div className="cube-shadow" />
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`cube-particle cube-particle--${i}`} />
      ))}
    </div>
  );
}

// ─── Bento ghost tiles (greyed out placeholder tiles) ─────────────────────────
function GhostTile({ delay, width = "1", label }: { delay: string; width?: string; label: string }) {
  return (
    <div
      className="ghost-tile"
      style={{
        gridColumn: `span ${width}`,
        animationDelay: delay,
      }}
    >
      <div className="ghost-shimmer" />
      <span className="ghost-label">{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EmptyState({ onCreateStream }: EmptyStateProps) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Orbitron:wght@500;700;900&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Page shell ── */
        .es-root {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(0,229,255,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 80%, rgba(109,40,217,0.07) 0%, transparent 50%),
            #05080f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          font-family: 'Outfit', sans-serif;
        }

        .es-frame {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 48px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .es-frame.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Hero section ── */
        .es-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          text-align: center;
        }

        /* ── Cube scene ── */
        .cube-scene {
          position: relative;
          width: 160px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cube-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(24px);
          pointer-events: none;
        }

        .cube-orb-1 {
          width: 100px;
          height: 100px;
          background: rgba(0,229,255,0.12);
          top: 10%;
          left: 10%;
          animation: orbDrift 5s ease-in-out infinite;
        }

        .cube-orb-2 {
          width: 80px;
          height: 80px;
          background: rgba(109,40,217,0.14);
          bottom: 5%;
          right: 5%;
          animation: orbDrift 6.5s ease-in-out infinite reverse;
          animation-delay: -2s;
        }

        @keyframes orbDrift {
          0%, 100% { transform: translate(0,0) scale(1); }
          50%       { transform: translate(8px, -12px) scale(1.1); }
        }

        /* ── CSS 3D Cube ── */
        .cube-wrapper {
          position: relative;
          perspective: 600px;
          animation: cubeFloat 5s ease-in-out infinite;
        }

        @keyframes cubeFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }

        .cube {
          width: 88px;
          height: 88px;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(28deg) rotateY(45deg);
          animation: cubeSpin 18s linear infinite;
        }

        @keyframes cubeSpin {
          from { transform: rotateX(28deg) rotateY(0deg); }
          to   { transform: rotateX(28deg) rotateY(360deg); }
        }

        .cube-face {
          position: absolute;
          width: 88px;
          height: 88px;
          border: 1.5px solid rgba(0,229,255,0.25);
          overflow: hidden;
          backface-visibility: visible;
        }

        .cube-face--front  { transform: translateZ(44px); }
        .cube-face--back   { transform: rotateY(180deg) translateZ(44px); }
        .cube-face--right  { transform: rotateY(90deg)  translateZ(44px); }
        .cube-face--left   { transform: rotateY(-90deg) translateZ(44px); }
        .cube-face--top    { transform: rotateX(90deg)  translateZ(44px); }
        .cube-face--bottom { transform: rotateX(-90deg) translateZ(44px); }

        /* Face backgrounds — each slightly different for depth */
        .face-inner {
          position: absolute;
          inset: 0;
        }

        .face-inner--front  { background: linear-gradient(135deg, rgba(0,229,255,0.12) 0%, rgba(0,229,255,0.04) 100%); }
        .face-inner--back   { background: linear-gradient(135deg, rgba(0,100,150,0.08) 0%, rgba(0,50,80,0.04)  100%); }
        .face-inner--right  { background: linear-gradient(135deg, rgba(0,180,220,0.10) 0%, rgba(0,100,160,0.04) 100%); }
        .face-inner--left   { background: linear-gradient(135deg, rgba(0,80,120,0.07)  0%, rgba(0,40,70,0.03)  100%); }
        .face-inner--top    { background: linear-gradient(135deg, rgba(0,229,255,0.18) 0%, rgba(0,180,230,0.06) 100%); }
        .face-inner--bottom { background: rgba(0,10,20,0.3); }

        /* Top face grid lines */
        .face-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,229,255,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.12) 1px, transparent 1px);
          background-size: 22px 22px;
        }

        /* Shimmer sweep across face */
        .face-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.1) 50%, transparent 80%);
          animation: faceShimmer 3s ease-in-out infinite;
        }

        @keyframes faceShimmer {
          0%   { transform: translateX(-100%); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }

        /* Front face icon */
        .face-content {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Cube drop shadow */
        .cube-shadow {
          position: absolute;
          bottom: -28px;
          left: 50%;
          transform: translateX(-50%);
          width: 70px;
          height: 16px;
          background: rgba(0,229,255,0.15);
          border-radius: 50%;
          filter: blur(10px);
          animation: shadowPulse 5s ease-in-out infinite;
        }

        @keyframes shadowPulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50%       { opacity: 0.3; transform: translateX(-50%) scaleX(0.75); }
        }

        /* Floating particles */
        .cube-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #00e5ff;
          box-shadow: 0 0 6px #00e5ff;
          pointer-events: none;
          animation: particleOrbit linear infinite;
        }

        .cube-particle--0 { top: 15%; left: 8%;  animation-duration: 7s;  animation-delay: 0s;    opacity: 0.5; width: 3px; height: 3px; }
        .cube-particle--1 { top: 70%; left: 12%; animation-duration: 9s;  animation-delay: -2s;   opacity: 0.35; background: #a78bfa; box-shadow: 0 0 6px #a78bfa; }
        .cube-particle--2 { top: 30%; right: 8%; animation-duration: 6s;  animation-delay: -1s;   opacity: 0.5; }
        .cube-particle--3 { top: 80%; right: 15%;animation-duration: 11s; animation-delay: -3.5s; opacity: 0.3; width: 3px; height: 3px; background: #34d399; box-shadow: 0 0 6px #34d399; }
        .cube-particle--4 { top: 5%;  left: 50%; animation-duration: 8s;  animation-delay: -1.5s; opacity: 0.4; width: 2px; height: 2px; }
        .cube-particle--5 { top: 90%; left: 40%; animation-duration: 10s; animation-delay: -4s;   opacity: 0.35; width: 3px; height: 3px; background: #a78bfa; box-shadow: 0 0 6px #a78bfa; }
        .cube-particle--6 { top: 50%; left: 3%;  animation-duration: 12s; animation-delay: -2.5s; opacity: 0.3; width: 2px; height: 2px; }
        .cube-particle--7 { top: 45%; right: 3%; animation-duration: 9.5s;animation-delay: -0.8s; opacity: 0.4; }

        @keyframes particleOrbit {
          0%   { transform: translateY(0) scale(1); opacity: inherit; }
          50%  { transform: translateY(-18px) scale(0.7); }
          100% { transform: translateY(0) scale(1); opacity: inherit; }
        }

        /* ── Text copy ── */
        .es-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(0,229,255,0.55);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .es-eyebrow::before,
        .es-eyebrow::after {
          content: '';
          display: block;
          width: 28px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,229,255,0.4));
        }

        .es-eyebrow::after {
          background: linear-gradient(90deg, rgba(0,229,255,0.4), transparent);
        }

        .es-headline {
          font-family: 'Orbitron', monospace;
          font-size: clamp(22px, 4vw, 32px);
          font-weight: 700;
          color: #e8eaf6;
          letter-spacing: -0.01em;
          line-height: 1.15;
        }

        .es-headline-accent {
          background: linear-gradient(135deg, #00e5ff, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .es-body {
          font-size: 15px;
          font-weight: 400;
          color: rgba(232,234,246,0.45);
          line-height: 1.7;
          max-width: 380px;
        }

        /* ── CTA button ── */
        .es-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 15px 32px;
          background: linear-gradient(135deg, rgba(0,229,255,0.14) 0%, rgba(109,40,217,0.1) 100%);
          border: 1px solid rgba(0,229,255,0.35);
          border-radius: 14px;
          font-family: 'Orbitron', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #00e5ff;
          cursor: pointer;
          transition: all 0.25s ease;
          overflow: hidden;
          text-transform: uppercase;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .es-cta {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .es-cta {
            transition: none;
          }
        }

        .es-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,229,255,0.2), rgba(109,40,217,0.15));
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .es-cta:hover {
          border-color: rgba(0,229,255,0.65);
          color: #fff;
          transform: translateY(-2px);
          box-shadow:
            0 0 24px rgba(0,229,255,0.25),
            0 0 60px rgba(0,229,255,0.1),
            0 8px 24px rgba(0,0,0,0.4);
        }

        .es-cta:hover::before { opacity: 1; }
        .es-cta:active { transform: translateY(0); }

        .es-cta-icon {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          transition: transform 0.25s ease;
        }

        .es-cta:hover .es-cta-icon { transform: rotate(90deg); }

        .es-cta-label { position: relative; z-index: 1; }

        /* Animated border sweep on button */
        .es-cta-sweep {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          animation: ctaSweep 3s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes ctaSweep {
          0%   { left: -60%; }
          100% { left: 160%; }
        }

        /* Secondary link */
        .es-secondary {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.06em;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.2s;
          font-family: 'Outfit', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .es-secondary:hover { color: rgba(255,255,255,0.45); }

        /* ── Bento ghost grid ── */
        .es-bento {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: auto auto;
          gap: 10px;
        }

        .ghost-tile {
          position: relative;
          height: 80px;
          background: rgba(255,255,255,0.025);
          border: 1px dashed rgba(255,255,255,0.07);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 10px 14px;
          animation: ghostFade 3s ease-in-out infinite alternate;
        }

        .ghost-tile:nth-child(1) { grid-column: span 2; height: 100px; animation-delay: 0s; }
        .ghost-tile:nth-child(2) { grid-column: span 1; animation-delay: 0.3s; }
        .ghost-tile:nth-child(3) { grid-column: span 1; animation-delay: 0.6s; }
        .ghost-tile:nth-child(4) { grid-column: span 1; animation-delay: 0.2s; }
        .ghost-tile:nth-child(5) { grid-column: span 2; animation-delay: 0.5s; }
        .ghost-tile:nth-child(6) { grid-column: span 1; animation-delay: 0.8s; }

        @keyframes ghostFade {
          from { opacity: 0.4; }
          to   { opacity: 0.7; }
        }

        .ghost-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.03) 50%, transparent 80%);
          animation: ghostShimmer 2.5s ease-in-out infinite;
        }

        @keyframes ghostShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .ghost-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.1);
          position: relative;
          z-index: 1;
        }

        /* Centered CTA overlay on bento */
        .es-bento-cta-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .es-bento-wrap {
          position: relative;
        }

        /* Bento label */
        .es-bento-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.12);
          margin-bottom: 8px;
        }

        /* Feature chips */
        .es-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .es-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.03em;
        }

        .es-chip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .es-bento { grid-template-columns: repeat(2, 1fr); }
          .ghost-tile:nth-child(1) { grid-column: span 2; }
          .ghost-tile:nth-child(5) { grid-column: span 2; }
        }
      `}</style>

      <div className="es-root">
        <div className={`es-frame${mounted ? " mounted" : ""}`}>

          {/* ── Hero ── */}
          <div className="es-hero">
            <FloatingGlassCube />

            <div className="es-eyebrow">StellarStream</div>

            <h1 className="es-headline">
              Your streams will<br />
              <span className="es-headline-accent">live here</span>
            </h1>

            <p className="es-body">
              You haven't created or received any streams yet. Start flowing value
              on-chain — continuously, trustlessly, and in real time.
            </p>

            {/* Feature chips */}
            <div className="es-chips">
              {[
                { label: "Real-time payments", color: "#00e5ff" },
                { label: "Any Stellar token",  color: "#a78bfa" },
                { label: "Cancel anytime",     color: "#34d399" },
              ].map(({ label, color }) => (
                <span key={label} className="es-chip">
                  <span className="es-chip-dot" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                  {label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              className="es-cta"
              onClick={onCreateStream}
              aria-label="Create your first stream"
            >
              <span className="es-cta-sweep" />
              <span className="es-cta-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <span className="es-cta-label">Create Your First Stream</span>
            </button>

            <button className="es-secondary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              How do streams work?
            </button>
          </div>

          {/* ── Ghost Bento grid ── */}
          <div className="es-bento-wrap" style={{ width: "100%" }}>
            <div className="es-bento-label">Your dashboard awaits</div>
            <div className="es-bento">
              <div className="ghost-tile" style={{ gridColumn: "span 2", height: 100 }}>
                <div className="ghost-shimmer" />
                <span className="ghost-label">Active streams</span>
              </div>
              <div className="ghost-tile">
                <div className="ghost-shimmer" />
                <span className="ghost-label">Sent total</span>
              </div>
              <div className="ghost-tile">
                <div className="ghost-shimmer" />
                <span className="ghost-label">Received</span>
              </div>
              <div className="ghost-tile">
                <div className="ghost-shimmer" />
                <span className="ghost-label">Gas balance</span>
              </div>
              <div className="ghost-tile" style={{ gridColumn: "span 2" }}>
                <div className="ghost-shimmer" />
                <span className="ghost-label">Stream activity</span>
              </div>
              <div className="ghost-tile">
                <div className="ghost-shimmer" />
                <span className="ghost-label">Token pairs</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}