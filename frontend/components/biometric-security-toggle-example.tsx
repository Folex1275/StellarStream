"use client";

import { useState } from "react";
import BiometricSecurityToggle from "./biometric-security-toggle";

export default function BiometricSecurityToggleExample() {
  const [privateMode, setPrivateMode] = useState(false);
  const [highSecurity, setHighSecurity] = useState(false);
  const [retinaMode, setRetinaMode] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        .biometric-demo-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #050510 0%, #0a0a14 100%);
          padding: 60px 40px;
          font-family: 'Syne', sans-serif;
        }

        .demo-header {
          max-width: 1200px;
          margin: 0 auto 48px;
          text-align: center;
        }

        .demo-title {
          font-size: 56px;
          font-weight: 800;
          background: linear-gradient(135deg, #00ff88, #00e5ff);
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
          max-width: 1200px;
          margin: 0 auto;
        }

        .demo-section {
          margin-bottom: 64px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: rgba(232, 234, 246, 0.9);
          margin-bottom: 32px;
          text-align: center;
        }

        .toggles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 48px;
          justify-items: center;
        }

        .toggle-card {
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          transition: border-color 0.3s ease;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .toggle-card {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .toggle-card:hover {
          border-color: rgba(0, 229, 255, 0.3);
        }

        .toggle-description {
          margin-top: 16px;
          font-size: 14px;
          color: rgba(232, 234, 246, 0.6);
          line-height: 1.6;
        }

        .status-panel {
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 24px;
          padding: 32px;
          margin-top: 48px;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .status-panel {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .toggle-card {
            transition: none;
          }
        }

        .status-title {
          font-size: 20px;
          font-weight: 700;
          color: rgba(232, 234, 246, 0.9);
          margin-bottom: 24px;
          text-align: center;
        }

        .status-items {
          display: grid;
          gap: 16px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(100, 100, 120, 0.2);
        }

        .status-item.active {
          border-color: rgba(0, 255, 136, 0.5);
          background: rgba(0, 255, 136, 0.05);
        }

        .status-label {
          font-size: 14px;
          font-weight: 600;
          color: rgba(232, 234, 246, 0.8);
        }

        .status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .status-badge.active {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.5);
        }

        .status-badge.inactive {
          background: rgba(100, 100, 120, 0.2);
          color: rgba(150, 150, 170, 0.8);
          border: 1px solid rgba(100, 100, 120, 0.3);
        }

        .use-cases {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 48px;
        }

        .use-case-card {
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 20px;
          padding: 32px;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .use-case-card {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .use-case-title {
          font-size: 18px;
          font-weight: 700;
          color: #00ff88;
          margin-bottom: 12px;
        }

        .use-case-description {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.6);
          line-height: 1.6;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin-top: 32px;
        }

        .features-list li {
          padding: 12px 0;
          border-bottom: 1px solid rgba(100, 100, 120, 0.2);
          color: rgba(232, 234, 246, 0.7);
          font-size: 14px;
        }

        .features-list li:last-child {
          border-bottom: none;
        }

        .features-list li::before {
          content: "✓";
          color: #00ff88;
          font-weight: bold;
          margin-right: 12px;
        }

        @media (max-width: 768px) {
          .biometric-demo-container {
            padding: 40px 20px;
          }

          .demo-title {
            font-size: 36px;
          }

          .toggles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="biometric-demo-container">
        <div className="demo-header">
          <h1 className="demo-title">Biometric Security Toggle</h1>
          <p className="demo-subtitle">
            Thumbprint and retina scan-inspired toggle switches with animated scan lines
          </p>
        </div>

        <div className="demo-content">
          {/* Main Toggles */}
          <section className="demo-section">
            <h2 className="section-title">Security Toggles</h2>
            <div className="toggles-grid">
              <div className="toggle-card">
                <BiometricSecurityToggle
                  label="Private Mode"
                  variant="thumbprint"
                  onChange={setPrivateMode}
                />
                <p className="toggle-description">
                  Enable private browsing mode with thumbprint authentication
                </p>
              </div>

              <div className="toggle-card">
                <BiometricSecurityToggle
                  label="High Security"
                  variant="thumbprint"
                  onChange={setHighSecurity}
                />
                <p className="toggle-description">
                  Activate enhanced security protocols for sensitive operations
                </p>
              </div>

              <div className="toggle-card">
                <BiometricSecurityToggle
                  label="Retina Scan"
                  variant="retina"
                  onChange={setRetinaMode}
                />
                <p className="toggle-description">
                  Enable retina scan verification for maximum security
                </p>
              </div>
            </div>
          </section>

          {/* Status Panel */}
          <section className="demo-section">
            <div className="status-panel">
              <h3 className="status-title">Security Status</h3>
              <div className="status-items">
                <div className={`status-item ${privateMode ? 'active' : ''}`}>
                  <span className="status-label">Private Mode</span>
                  <span className={`status-badge ${privateMode ? 'active' : 'inactive'}`}>
                    {privateMode ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={`status-item ${highSecurity ? 'active' : ''}`}>
                  <span className="status-label">High Security</span>
                  <span className={`status-badge ${highSecurity ? 'active' : 'inactive'}`}>
                    {highSecurity ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={`status-item ${retinaMode ? 'active' : ''}`}>
                  <span className="status-label">Retina Scan</span>
                  <span className={`status-badge ${retinaMode ? 'active' : 'inactive'}`}>
                    {retinaMode ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="demo-section">
            <h2 className="section-title">Use Cases</h2>
            <div className="use-cases">
              <div className="use-case-card">
                <h3 className="use-case-title">Private Transactions</h3>
                <p className="use-case-description">
                  Enable private mode for confidential payment streams and sensitive financial operations
                </p>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Enhanced Security</h3>
                <p className="use-case-description">
                  Activate high security mode for large transfers, governance actions, or admin operations
                </p>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Multi-Factor Auth</h3>
                <p className="use-case-description">
                  Combine biometric toggles with wallet signatures for multi-layered authentication
                </p>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Settings Panel</h3>
                <p className="use-case-description">
                  Use in user settings to control privacy preferences and security levels
                </p>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Dashboard Controls</h3>
                <p className="use-case-description">
                  Quick access toggles for enabling/disabling security features on the fly
                </p>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Compliance Mode</h3>
                <p className="use-case-description">
                  Toggle compliance features like OFAC screening or KYC verification
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="demo-section">
            <div className="status-panel">
              <h3 className="status-title">Component Features</h3>
              <ul className="features-list">
                <li>Animated scan lines that move vertically when active</li>
                <li>Glass morphism card design with backdrop blur</li>
                <li>Color transition from dim gray to neon success green</li>
                <li>Two variants: thumbprint and retina scan icons</li>
                <li>Smooth animations and transitions</li>
                <li>Pulsing glow effect when active</li>
                <li>Keyboard accessible (Enter/Space to toggle)</li>
                <li>Disabled state support</li>
                <li>Custom labels and onChange callbacks</li>
                <li>Responsive and mobile-friendly</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
