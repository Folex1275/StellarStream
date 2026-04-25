"use client";

import { useState } from "react";
import NetworkPulseVisualizer from "./network-pulse-visualizer";

export default function NetworkPulseVisualizerExample() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [laneCount, setLaneCount] = useState(4);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        .network-pulse-demo-container {
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
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .visualizer-section {
          background: rgba(6, 6, 15, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
          backdrop-filter: blur(24px);
        }

        .section-title {
          font-size: 24px;
          font-weight: 600;
          color: #e8eaf6;
          margin-bottom: 24px;
        }

        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-label {
          font-size: 14px;
          color: rgba(232, 234, 246, 0.8);
          font-weight: 500;
        }

        .control-input {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e8eaf6;
          font-size: 14px;
        }

        .control-input:focus {
          outline: none;
          border-color: #00e5ff;
          box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.2);
        }

        .toggle-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
        }

        .visualizer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 24px;
          align-items: start;
        }

        .visualizer-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .visualizer-label {
          font-size: 12px;
          color: rgba(232, 234, 246, 0.6);
          text-align: center;
        }

        .integration-section {
          background: rgba(6, 6, 15, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
        }

        .code-block {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          color: #e8eaf6;
          overflow-x: auto;
        }

        .highlight {
          color: #00e5ff;
        }
      `}</style>

      <div className="network-pulse-demo-container">
        <div className="demo-header">
          <div className="demo-title">Network Pulse Visualizer</div>
          <div className="demo-subtitle">
            Protocol 23 (Whisk) Parallel Transaction Processing
          </div>
        </div>

        <div className="demo-content">
          <div className="visualizer-section">
            <div className="section-title">Interactive Demo</div>

            <div className="controls-grid">
              <div className="control-group">
                <label className="control-label">Processing State</label>
                <button
                  className="toggle-button"
                  onClick={() => setIsProcessing(!isProcessing)}
                >
                  {isProcessing ? "Stop Processing" : "Start Processing"}
                </button>
              </div>

              <div className="control-group">
                <label className="control-label">Lane Count</label>
                <select
                  className="control-input"
                  value={laneCount}
                  onChange={(e) => setLaneCount(Number(e.target.value))}
                >
                  <option value={2}>2 Lanes</option>
                  <option value={3}>3 Lanes</option>
                  <option value={4}>4 Lanes</option>
                  <option value={6}>6 Lanes</option>
                  <option value={8}>8 Lanes</option>
                </select>
              </div>
            </div>

            <div className="visualizer-grid">
              <div className="visualizer-item">
                <NetworkPulseVisualizer
                  laneCount={laneCount}
                  isProcessing={isProcessing}
                  size={120}
                />
                <div className="visualizer-label">Small (120px)</div>
              </div>

              <div className="visualizer-item">
                <NetworkPulseVisualizer
                  laneCount={laneCount}
                  isProcessing={isProcessing}
                  size={160}
                />
                <div className="visualizer-label">Medium (160px)</div>
              </div>

              <div className="visualizer-item">
                <NetworkPulseVisualizer
                  laneCount={laneCount}
                  isProcessing={isProcessing}
                  size={200}
                />
                <div className="visualizer-label">Large (200px)</div>
              </div>
            </div>
          </div>

          <div className="integration-section">
            <div className="section-title">Integration Guide</div>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ color: "#e8eaf6", marginBottom: "12px", fontSize: "18px" }}>
                Basic Usage
              </h3>
              <div className="code-block">
{`<NetworkPulseVisualizer
  laneCount={4}
  isProcessing={true}
  size={120}
/>`}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ color: "#e8eaf6", marginBottom: "12px", fontSize: "18px" }}>
                Props
              </h3>
              <div className="code-block">
{`interface NetworkPulseVisualizerProps {
  /** Number of parallel lanes to show (default: 4) */
  laneCount?: number;
  /** Whether to show active transaction processing */
  isProcessing?: boolean;
  /** Size of the visualizer in pixels */
  size?: number;
}`}
              </div>
            </div>

            <div>
              <h3 style={{ color: "#e8eaf6", marginBottom: "12px", fontSize: "18px" }}>
                Use Cases
              </h3>
              <ul style={{ color: "rgba(232, 234, 246, 0.8)", lineHeight: "1.6" }}>
                <li>• Transaction confirmation dialogs</li>
                <li>• Stream processing indicators</li>
                <li>• Network status dashboards</li>
                <li>• Protocol 23 (Whisk) feature showcases</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}