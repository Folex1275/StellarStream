"use client";

import { useState } from "react";
import GlitchText from "./glitch-text";

export default function GlitchTextExample() {
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [hoverMode, setHoverMode] = useState(true);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        .glitch-demo-container {
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
          margin-bottom: 16px;
        }

        .demo-subtitle {
          font-size: 18px;
          color: rgba(232, 234, 246, 0.6);
          margin-bottom: 32px;
        }

        .demo-controls {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .control-label {
          font-size: 12px;
          color: rgba(232, 234, 246, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .button-group {
          display: flex;
          gap: 8px;
          background: rgba(10, 10, 20, 0.6);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(0, 229, 255, 0.2);
        }

        .control-button {
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(232, 234, 246, 0.7);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-button:hover {
          color: #00e5ff;
          background: rgba(0, 229, 255, 0.1);
        }

        .control-button.active {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(138, 43, 226, 0.2));
          color: #00e5ff;
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .demo-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .demo-section {
          margin-bottom: 64px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: rgba(232, 234, 246, 0.8);
          margin-bottom: 24px;
          text-align: center;
        }

        .examples-grid {
          display: grid;
          gap: 32px;
        }

        .example-card {
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 24px;
          padding: 48px;
          text-align: center;
          transition: border-color 0.3s ease;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .example-card {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .example-card:hover {
          border-color: rgba(0, 229, 255, 0.3);
        }

        .example-label {
          font-size: 12px;
          color: rgba(232, 234, 246, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
        }

        .size-h1 {
          font-size: 56px;
          line-height: 1.2;
        }

        .size-h2 {
          font-size: 42px;
          line-height: 1.2;
        }

        .size-h3 {
          font-size: 32px;
          line-height: 1.3;
        }

        .size-h4 {
          font-size: 24px;
          line-height: 1.4;
        }

        .gradient-text {
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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

        @media (prefers-reduced-motion: reduce) {
          .example-card {
            transition: none;
          }
        }

        .use-case-title {
          font-size: 24px;
          margin-bottom: 12px;
        }

        .use-case-description {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.6);
          line-height: 1.6;
        }

        .hint-text {
          text-align: center;
          font-size: 14px;
          color: rgba(232, 234, 246, 0.5);
          margin-top: 32px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .glitch-demo-container {
            padding: 40px 20px;
          }

          .demo-title {
            font-size: 36px;
          }

          .size-h1 {
            font-size: 36px;
          }

          .size-h2 {
            font-size: 28px;
          }

          .size-h3 {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="glitch-demo-container">
        <div className="demo-header">
          <GlitchText as="h1" className="demo-title gradient-text" glitchIntensity={intensity}>
            Cyberpunk Glitch Text
          </GlitchText>
          <p className="demo-subtitle">
            RGB channel shifting animation for futuristic headers and titles
          </p>

          <div className="demo-controls">
            <div className="control-group">
              <span className="control-label">Intensity</span>
              <div className="button-group">
                <button
                  className={`control-button ${intensity === 'low' ? 'active' : ''}`}
                  onClick={() => setIntensity('low')}
                >
                  Low
                </button>
                <button
                  className={`control-button ${intensity === 'medium' ? 'active' : ''}`}
                  onClick={() => setIntensity('medium')}
                >
                  Medium
                </button>
                <button
                  className={`control-button ${intensity === 'high' ? 'active' : ''}`}
                  onClick={() => setIntensity('high')}
                >
                  High
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Mode</span>
              <div className="button-group">
                <button
                  className={`control-button ${hoverMode ? 'active' : ''}`}
                  onClick={() => setHoverMode(true)}
                >
                  On Hover
                </button>
                <button
                  className={`control-button ${!hoverMode ? 'active' : ''}`}
                  onClick={() => setHoverMode(false)}
                >
                  Always On
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="demo-content">
          {/* Typography Sizes */}
          <section className="demo-section">
            <h2 className="section-title">Typography Sizes</h2>
            <div className="examples-grid">
              <div className="example-card">
                <div className="example-label">H1 - Hero Title</div>
                <GlitchText 
                  as="h1" 
                  className="size-h1" 
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  StellarStream
                </GlitchText>
              </div>

              <div className="example-card">
                <div className="example-label">H2 - Section Title</div>
                <GlitchText 
                  as="h2" 
                  className="size-h2" 
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Payment Streams
                </GlitchText>
              </div>

              <div className="example-card">
                <div className="example-label">H3 - Card Title</div>
                <GlitchText 
                  as="h3" 
                  className="size-h3" 
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Active Streams
                </GlitchText>
              </div>

              <div className="example-card">
                <div className="example-label">H4 - Component Title</div>
                <GlitchText 
                  as="h4" 
                  className="size-h4" 
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Stream Details
                </GlitchText>
              </div>
            </div>
          </section>

          {/* With Gradient */}
          <section className="demo-section">
            <h2 className="section-title">With Gradient</h2>
            <div className="example-card">
              <GlitchText 
                as="h1" 
                className="size-h1 gradient-text" 
                glitchOnHover={hoverMode}
                glitchIntensity={intensity}
              >
                Futuristic Design
              </GlitchText>
            </div>
          </section>

          {/* Use Cases */}
          <section className="demo-section">
            <h2 className="section-title">Real-World Use Cases</h2>
            <div className="use-cases">
              <div className="use-case-card">
                <GlitchText 
                  as="h3" 
                  className="use-case-title gradient-text"
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Dashboard Header
                </GlitchText>
                <p className="use-case-description">
                  Use for main dashboard titles to create an engaging, futuristic entry point
                </p>
              </div>

              <div className="use-case-card">
                <GlitchText 
                  as="h3" 
                  className="use-case-title gradient-text"
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Feature Sections
                </GlitchText>
                <p className="use-case-description">
                  Highlight key features with subtle glitch effects on hover for interactive feel
                </p>
              </div>

              <div className="use-case-card">
                <GlitchText 
                  as="h3" 
                  className="use-case-title gradient-text"
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Stream Cards
                </GlitchText>
                <p className="use-case-description">
                  Add cyberpunk flair to stream card titles for enhanced visual hierarchy
                </p>
              </div>

              <div className="use-case-card">
                <GlitchText 
                  as="h3" 
                  className="use-case-title gradient-text"
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Modal Headers
                </GlitchText>
                <p className="use-case-description">
                  Create attention-grabbing modal titles that maintain the futuristic aesthetic
                </p>
              </div>

              <div className="use-case-card">
                <GlitchText 
                  as="h3" 
                  className="use-case-title gradient-text"
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Navigation Items
                </GlitchText>
                <p className="use-case-description">
                  Apply to active navigation items for subtle interactive feedback
                </p>
              </div>

              <div className="use-case-card">
                <GlitchText 
                  as="h3" 
                  className="use-case-title gradient-text"
                  glitchOnHover={hoverMode}
                  glitchIntensity={intensity}
                >
                  Call-to-Action
                </GlitchText>
                <p className="use-case-description">
                  Enhance CTA buttons and links with glitch effect for increased engagement
                </p>
              </div>
            </div>
          </section>

          <p className="hint-text">
            {hoverMode ? '💡 Hover over any text to see the glitch effect' : '✨ Glitch effect is always active'}
          </p>
        </div>
      </div>
    </>
  );
}
