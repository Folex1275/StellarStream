"use client";

import { useState } from "react";
import CopyRipple from "./copy-ripple";

export default function CopyRippleExample() {
  const [copyCount, setCopyCount] = useState(0);
  const [lastCopied, setLastCopied] = useState<string>("");

  const handleCopy = (label: string) => {
    setCopyCount((prev) => prev + 1);
    setLastCopied(label);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        .copy-ripple-demo-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #050510 0%, #0a0a14 100%);
          padding: 60px 40px;
          font-family: 'Syne', sans-serif;
        }

        .demo-header {
          max-width: 900px;
          margin: 0 auto 48px;
          text-align: center;
        }

        .demo-title {
          font-size: 56px;
          font-weight: 800;
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
        }

        .demo-subtitle {
          font-size: 18px;
          color: rgba(232, 234, 246, 0.6);
          margin-bottom: 32px;
        }

        .demo-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .demo-section {
          margin-bottom: 48px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: rgba(232, 234, 246, 0.9);
          margin-bottom: 24px;
        }

        .demo-grid {
          display: grid;
          gap: 24px;
        }

        .stats-panel {
          background: rgba(10, 10, 20, 0.90);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .stats-panel {
            background: rgba(10, 10, 20, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }

        .stats-title {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(232, 234, 246, 0.5);
          margin-bottom: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-item {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 16px;
        }

        .stat-label {
          font-size: 11px;
          color: rgba(232, 234, 246, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: #00e5ff;
        }

        .stat-text {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.8);
          word-break: break-all;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 32px;
        }

        .feature-card {
          background: rgba(10, 10, 20, 0.6);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 16px;
          padding: 24px;
        }

        .feature-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          font-size: 20px;
        }

        .feature-title {
          font-size: 16px;
          font-weight: 700;
          color: #e8eaf6;
          margin-bottom: 8px;
        }

        .feature-description {
          font-size: 13px;
          color: rgba(232, 234, 246, 0.6);
          line-height: 1.6;
        }

        .instruction-box {
          background: rgba(0, 229, 255, 0.05);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .instruction-text {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.8);
          line-height: 1.6;
        }

        .instruction-highlight {
          color: #00e5ff;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .copy-ripple-demo-container {
            padding: 40px 20px;
          }

          .demo-title {
            font-size: 36px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="copy-ripple-demo-container">
        <div className="demo-header">
          <h1 className="demo-title">Copy Ripple</h1>
          <p className="demo-subtitle">
            G-Address display with electric cyan ripple effect on copy
          </p>
        </div>

        <div className="demo-content">
          {/* Instructions */}
          <div className="instruction-box">
            <p className="instruction-text">
              Click the <span className="instruction-highlight">copy icon</span> to see the electric cyan ripple effect expand from the click point across the card.
            </p>
          </div>

          {/* Examples */}
          <section className="demo-section">
            <h2 className="section-title">G-Address Examples</h2>
            <div className="demo-grid">
              <CopyRipple
                address="GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMEK"
                label="Stellar Address"
                onCopy={() => handleCopy("Stellar Address")}
              />

              <CopyRipple
                address="GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5"
                label="Recipient Address"
                onCopy={() => handleCopy("Recipient Address")}
              />

              <CopyRipple
                address="GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"
                label="Stream Sender"
                onCopy={() => handleCopy("Stream Sender")}
              />

              <CopyRipple
                address="GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ"
                label="Vault Address"
                onCopy={() => handleCopy("Vault Address")}
              />
            </div>
          </section>

          {/* Custom Content */}
          <section className="demo-section">
            <h2 className="section-title">Custom Display</h2>
            <div className="demo-grid">
              <CopyRipple
                address="GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMEK"
                label="Full Address"
                onCopy={() => handleCopy("Full Address")}
              >
                GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMEK
              </CopyRipple>

              <CopyRipple
                address="GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5"
                label="Shortened"
                onCopy={() => handleCopy("Shortened")}
              >
                GBVOL6...225PL5
              </CopyRipple>
            </div>
          </section>

          {/* Stats */}
          <section className="demo-section">
            <div className="stats-panel">
              <div className="stats-title">Interaction Stats</div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Total Copies</div>
                  <div className="stat-value">{copyCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Last Copied</div>
                  <div className="stat-text">{lastCopied || "None yet"}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="demo-section">
            <h2 className="section-title">Component Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">💧</div>
                <div className="feature-title">Electric Cyan Ripple</div>
                <div className="feature-description">
                  Ripple effect expands from click point with radial gradient and smooth animation
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <div className="feature-title">Clipboard Copy</div>
                <div className="feature-description">
                  Automatically copies address to clipboard with visual feedback
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">✨</div>
                <div className="feature-title">Visual Feedback</div>
                <div className="feature-description">
                  Icon changes to checkmark with tooltip confirmation when copied
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <div className="feature-title">Click Position</div>
                <div className="feature-description">
                  Ripple originates from exact click location for natural feel
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⌨️</div>
                <div className="feature-title">Keyboard Accessible</div>
                <div className="feature-description">
                  Full keyboard support with visible focus indicators
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <div className="feature-title">Responsive Design</div>
                <div className="feature-description">
                  Adapts to mobile with optimized sizing and spacing
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
