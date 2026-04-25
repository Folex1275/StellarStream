"use client";

import { useState } from "react";
import XLMBalanceOrb from "./xlm-balance-orb";

export default function XLMBalanceOrbExample() {
  const [balance, setBalance] = useState(3.5);
  const [position, setPosition] = useState<"bottom-left" | "bottom-right">("bottom-right");
  const [showOrb, setShowOrb] = useState(true);

  const handleBridgeClick = () => {
    alert("Redirecting to bridge...");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        .orb-demo-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #050510 0%, #0a0a14 100%);
          padding: 60px 40px;
          font-family: 'Syne', sans-serif;
          position: relative;
        }

        .demo-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .demo-title {
          font-size: 42px;
          font-weight: 800;
          background: linear-gradient(135deg, #ffa500, #ff8c00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .demo-subtitle {
          font-size: 16px;
          color: rgba(232, 234, 246, 0.6);
          margin-bottom: 32px;
        }

        .controls-panel {
          background: rgba(10, 10, 20, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 165, 0, 0.15);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 40px;
          box-shadow: 
            0 0 0 1px rgba(255, 165, 0, 0.05),
            0 8px 40px rgba(0, 0, 0, 0.6);
        }

        .control-group {
          margin-bottom: 24px;
        }

        .control-group:last-child {
          margin-bottom: 0;
        }

        .control-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: rgba(232, 234, 246, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .balance-slider {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .balance-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffa500, #ff8c00);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
        }

        .balance-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffa500, #ff8c00);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 165, 0, 0.5);
        }

        .balance-display {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: 12px;
          font-family: 'Space Mono', monospace;
        }

        .balance-number {
          font-size: 32px;
          font-weight: 700;
          color: #ffa500;
        }

        .balance-xlm {
          font-size: 16px;
          color: rgba(255, 165, 0, 0.7);
        }

        .button-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .demo-button {
          padding: 12px 24px;
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid rgba(255, 165, 0, 0.3);
          border-radius: 12px;
          color: #ffa500;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .demo-button:hover {
          background: rgba(255, 165, 0, 0.2);
          border-color: rgba(255, 165, 0, 0.5);
          box-shadow: 0 0 20px rgba(255, 165, 0, 0.2);
          transform: translateY(-2px);
        }

        .demo-button.active {
          background: linear-gradient(135deg, rgba(255, 165, 0, 0.9), rgba(255, 140, 0, 0.9));
          color: #0a0a14;
          border-color: rgba(255, 200, 100, 0.4);
        }

        .info-card {
          background: rgba(255, 165, 0, 0.05);
          border: 1px solid rgba(255, 165, 0, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-top: 32px;
        }

        .info-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffa500;
          margin-bottom: 12px;
        }

        .info-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-list li {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.7);
          line-height: 1.8;
          padding-left: 24px;
          position: relative;
        }

        .info-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #ffa500;
        }

        .placeholder-content {
          margin-top: 60px;
          text-align: center;
          color: rgba(232, 234, 246, 0.4);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .orb-demo-container {
            padding: 40px 20px;
          }

          .demo-title {
            font-size: 32px;
          }

          .controls-panel {
            padding: 24px;
          }
        }
      `}</style>

      <div className="orb-demo-container">
        <div className="demo-content">
          <div className="demo-header">
            <h1 className="demo-title">XLM Balance Orb</h1>
            <p className="demo-subtitle">
              Persistent, non-intrusive floating warning for low XLM balance
            </p>
          </div>

          <div className="controls-panel">
            <div className="control-group">
              <label className="control-label">XLM Balance</label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value))}
                className="balance-slider"
              />
              <div className="balance-display">
                <span className="balance-number">{balance.toFixed(2)}</span>
                <span className="balance-xlm">XLM</span>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Position</label>
              <div className="button-group">
                <button
                  className={`demo-button ${position === "bottom-left" ? "active" : ""}`}
                  onClick={() => setPosition("bottom-left")}
                >
                  Bottom Left
                </button>
                <button
                  className={`demo-button ${position === "bottom-right" ? "active" : ""}`}
                  onClick={() => setPosition("bottom-right")}
                >
                  Bottom Right
                </button>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Visibility</label>
              <div className="button-group">
                <button
                  className={`demo-button ${showOrb ? "active" : ""}`}
                  onClick={() => setShowOrb(true)}
                >
                  Show Orb
                </button>
                <button
                  className={`demo-button ${!showOrb ? "active" : ""}`}
                  onClick={() => setShowOrb(false)}
                >
                  Hide Orb
                </button>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Quick Actions</label>
              <div className="button-group">
                <button
                  className="demo-button"
                  onClick={() => setBalance(2.5)}
                >
                  Set Low (2.5 XLM)
                </button>
                <button
                  className="demo-button"
                  onClick={() => setBalance(10)}
                >
                  Set High (10 XLM)
                </button>
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-title">How It Works</div>
            <ul className="info-list">
              <li>Orb appears when XLM balance drops below 5 XLM threshold</li>
              <li>Pulses gently with orange glow to catch attention</li>
              <li>Click the orb to expand into detailed information bubble</li>
              <li>Shows current balance and explanation about storage rent</li>
              <li>Provides quick action to bridge more XLM</li>
              <li>Non-intrusive design stays in corner, doesn't block content</li>
              <li>Fully accessible with keyboard navigation and ARIA labels</li>
            </ul>
          </div>

          <div className="placeholder-content">
            <p>Scroll around to see the orb stays fixed in position</p>
            <p style={{ marginTop: "800px" }}>↓ Keep scrolling ↓</p>
            <p style={{ marginTop: "800px" }}>The orb follows you!</p>
          </div>
        </div>

        {/* XLM Balance Orb */}
        {showOrb && (
          <XLMBalanceOrb
            balance={balance}
            threshold={5}
            position={position}
            onBridgeClick={handleBridgeClick}
          />
        )}
      </div>
    </>
  );
}
