"use client";

export default function CrossChainBento() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        .bento-card {
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
          .bento-card {
            background: linear-gradient(180deg, rgba(6,6,15,0.7), rgba(10,10,20,0.65));
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
        }

        /* Nebula / spiral wormhole */
        .nebula {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .nebula::before {
          content: '';
          position: absolute;
          inset: -30%;
          background: repeating-conic-gradient(
            from 0deg,
            rgba(120,80,240,0.06) 0deg 8deg,
            rgba(0,229,255,0.045) 8deg 16deg
          );
          mix-blend-mode: screen;
          filter: blur(28px) saturate(1.2) contrast(1.05);
          transform-origin: center;
          animation: nebula-spin 60s linear infinite;
          opacity: 0.95;
        }

        .nebula::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 380px;
          height: 380px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle at 40% 40%, rgba(138,43,226,0.18) 0%, transparent 30%),
                      radial-gradient(circle at 60% 60%, rgba(0,229,255,0.12) 0%, transparent 28%),
                      radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 48%);
          filter: blur(18px);
          opacity: 0.95;
        }

        @keyframes nebula-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .wormhole-center {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 120px;
          height: 120px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), rgba(138,43,226,0.08) 25%, rgba(0,229,255,0.03) 50%, rgba(0,0,0,0));
          box-shadow: 0 0 36px rgba(138,43,226,0.18), inset 0 0 30px rgba(0,229,255,0.06);
          mix-blend-mode: screen;
          pointer-events: none;
          animation: pulse 6s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(0.96); opacity: 0.9; }
        }

        .labels {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.02em;
          background: linear-gradient(90deg, #00e5ff, #8a2be2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: 12px;
          color: rgba(232,234,246,0.65);
          margin-top: 6px;
        }

        .logos {
          margin-left: auto;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .logo-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 24px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: #081018;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        }

        .eth { background: linear-gradient(180deg,#9aa9b8,#e6eef7); }
        .sol { background: linear-gradient(180deg,#7ef3d0,#00c2a8); color: #052018; }

        .coming {
          margin-top: 14px;
          font-size: 13px;
          color: rgba(232,234,246,0.9);
        }

        .hint {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(232,234,246,0.45);
        }

      `}</style>

      <div className="bento-card" role="group" aria-label="Cross chain flow coming soon">
        <div className="nebula" aria-hidden="true"></div>
        <div className="wormhole-center" aria-hidden="true"></div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="labels">
            <div>
              <div className="title">Cross-Chain Flow</div>
              <div className="subtitle">The Wormhole — bridging Ethereum & Solana</div>
            </div>

            <div className="logos" aria-hidden="true">
              <div className="logo-pill eth" title="Ethereum">ETH</div>
              <div className="logo-pill sol" title="Solana">SOL</div>
            </div>
          </div>

          <div className="coming">Coming Soon.</div>
          <div className="hint">A slow-moving nebula hints at future cross-chain streaming support.</div>
        </div>
      </div>
    </>
  );
}
