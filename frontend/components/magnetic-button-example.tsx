"use client";

import { useState } from "react";
import MagneticButton from "./magnetic-button";

export default function MagneticButtonExample() {
  const [signCount, setSignCount] = useState(0);
  const [approveCount, setApproveCount] = useState(0);
  const [rejectCount, setRejectCount] = useState(0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        .magnetic-demo-container {
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

        .button-showcase {
          display: flex;
          flex-direction: column;
          gap: 48px;
          align-items: center;
        }

        .button-row {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .button-card {
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 24px;
          padding: 48px;
          text-align: center;
          min-width: 300px;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .button-card {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .button-label {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.6);
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .button-description {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.6);
          margin-top: 16px;
          line-height: 1.6;
        }

        .stats-panel {
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 24px;
          padding: 32px;
          margin-top: 48px;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .stats-panel {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .stats-title {
          font-size: 20px;
          font-weight: 700;
          color: rgba(232, 234, 246, 0.9);
          margin-bottom: 24px;
          text-align: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .stat-item {
          text-align: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          border: 1px solid rgba(100, 100, 120, 0.2);
        }

        .stat-value {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .features-list {
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 24px;
          padding: 32px;
          margin-top: 48px;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .features-list {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .features-title {
          font-size: 20px;
          font-weight: 700;
          color: rgba(232, 234, 246, 0.9);
          margin-bottom: 24px;
          text-align: center;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }

        .feature-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          flex-shrink: 0;
        }

        .feature-text {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.7);
          line-height: 1.6;
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
          color: #00e5ff;
          margin-bottom: 12px;
        }

        .use-case-description {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.6);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .hint-text {
          text-align: center;
          font-size: 14px;
          color: rgba(232, 234, 246, 0.5);
          margin-top: 32px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .magnetic-demo-container {
            padding: 40px 20px;
          }

          .demo-title {
            font-size: 36px;
          }

          .button-row {
            flex-direction: column;
          }

          .button-card {
            min-width: auto;
            width: 100%;
          }
        }
      `}</style>

      <div className="magnetic-demo-container">
        <div className="demo-header">
          <h1 className="demo-title">Magnetic Button</h1>
          <p className="demo-subtitle">
            High-end button with cursor attraction and haptic feedback
          </p>
        </div>

        <div className="demo-content">
          {/* Main Showcase */}
          <section className="demo-section">
            <h2 className="section-title">Primary Actions</h2>
            <div className="button-showcase">
              <div className="button-card">
                <div className="button-label">Sign Transaction</div>
                <MagneticButton
                  variant="primary"
                  onClick={() => setSignCount(signCount + 1)}
                >
                  Sign Transaction
                </MagneticButton>
                <p className="button-description">
                  Electric cyan with hyper violet shadow. Magnetic attraction within 5-10px.
                </p>
              </div>

              <div className="button-row">
                <div className="button-card">
                  <div className="button-label">Approve Action</div>
                  <MagneticButton
                    variant="secondary"
                    onClick={() => setApproveCount(approveCount + 1)}
                  >
                    Approve
                  </MagneticButton>
                  <p className="button-description">
                    Hyper violet with cyan shadow for secondary actions.
                  </p>
                </div>

                <div className="button-card">
                  <div className="button-label">Reject Action</div>
                  <MagneticButton
                    variant="danger"
                    onClick={() => setRejectCount(rejectCount + 1)}
                  >
                    Reject
                  </MagneticButton>
                  <p className="button-description">
                    Danger variant for destructive actions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Panel */}
          <section className="demo-section">
            <div className="stats-panel">
              <h3 className="stats-title">Interaction Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{signCount}</div>
                  <div className="stat-label">Signatures</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{approveCount}</div>
                  <div className="stat-label">Approvals</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{rejectCount}</div>
                  <div className="stat-label">Rejections</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="demo-section">
            <div className="features-list">
              <h3 className="features-title">Component Features</h3>
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Magnetic attraction effect (5-10px cursor following)
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Haptic-style scale down on click (0.95x)
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Electric cyan background with gradient
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Hyper violet shadow that expands on hover
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Smooth transitions with cubic-bezier easing
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Ripple effect on click activation
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Three variants: primary, secondary, danger
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Disabled state with reduced opacity
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Configurable magnetic strength
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">✓</div>
                  <div className="feature-text">
                    Responsive and mobile-friendly
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="demo-section">
            <h2 className="section-title">Use Cases</h2>
            <div className="use-cases">
              <div className="use-case-card">
                <h3 className="use-case-title">Transaction Signing</h3>
                <p className="use-case-description">
                  Primary action for signing blockchain transactions with wallet integration.
                </p>
                <MagneticButton variant="primary" magneticStrength={10}>
                  Sign with Wallet
                </MagneticButton>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Stream Creation</h3>
                <p className="use-case-description">
                  Create new payment streams with magnetic button for enhanced UX.
                </p>
                <MagneticButton variant="primary" magneticStrength={8}>
                  Create Stream
                </MagneticButton>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Governance Voting</h3>
                <p className="use-case-description">
                  Cast votes on governance proposals with clear visual feedback.
                </p>
                <MagneticButton variant="secondary" magneticStrength={7}>
                  Cast Vote
                </MagneticButton>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Withdrawal Action</h3>
                <p className="use-case-description">
                  Withdraw funds from streams with magnetic attraction for precision.
                </p>
                <MagneticButton variant="primary" magneticStrength={9}>
                  Withdraw Funds
                </MagneticButton>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Cancel Stream</h3>
                <p className="use-case-description">
                  Destructive action with danger variant for stream cancellation.
                </p>
                <MagneticButton variant="danger" magneticStrength={6}>
                  Cancel Stream
                </MagneticButton>
              </div>

              <div className="use-case-card">
                <h3 className="use-case-title">Disabled State</h3>
                <p className="use-case-description">
                  Button disabled when conditions aren't met (e.g., insufficient balance).
                </p>
                <MagneticButton variant="primary" disabled>
                  Insufficient Balance
                </MagneticButton>
              </div>
            </div>
          </section>

          <p className="hint-text">
            💡 Move your cursor near the buttons to experience the magnetic attraction effect
          </p>
        </div>
      </div>
    </>
  );
}
