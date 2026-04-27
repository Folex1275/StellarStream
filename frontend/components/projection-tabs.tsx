"use client";

import { useState, ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface ProjectionTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export default function ProjectionTabs({
  tabs,
  defaultTab,
  onChange,
  className = "",
}: ProjectionTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <>
      <style>{`
        .projection-tabs-container {
          width: 100%;
          font-family: 'Syne', sans-serif;
        }

        .tabs-header {
          display: flex;
          gap: 8px;
          padding: 8px;
          background: rgba(10, 10, 20, 0.82);
          border-radius: 16px;
          border: 1px solid rgba(100, 100, 120, 0.2);
          position: relative;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .tabs-header {
            background: rgba(10, 10, 20, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }

        .tab-button {
          flex: 1;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          color: rgba(232, 234, 246, 0.6);
          background: transparent;
          z-index: 1;
        }

        .tab-button::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 120%;
          height: 200%;
          background: radial-gradient(
            ellipse at bottom,
            rgba(0, 229, 255, 0.4) 0%,
            rgba(0, 229, 255, 0.2) 30%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .tab-button.active {
          color: #ffffff;
          background: rgba(0, 229, 255, 0.18);
          border: 1px solid rgba(0, 229, 255, 0.3);
          box-shadow: 
            0 0 20px rgba(0, 229, 255, 0.3),
            inset 0 0 20px rgba(0, 229, 255, 0.1);
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .tab-button.active {
            background: rgba(0, 229, 255, 0.1);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .tab-button.active::before {
          opacity: 1;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #00e5ff 50%,
            transparent 100%
          );
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.8);
        }

        .tab-button:not(.active):hover {
          color: rgba(232, 234, 246, 0.9);
          background: rgba(0, 229, 255, 0.05);
        }

        .tab-button:not(.active):hover::before {
          opacity: 0.3;
        }

        .tab-content {
          margin-top: 24px;
          padding: 24px;
          background: rgba(10, 10, 20, 0.80);
          border-radius: 16px;
          border: 1px solid rgba(100, 100, 120, 0.2);
          animation: fadeIn 0.3s ease;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .tab-content {
            background: rgba(10, 10, 20, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .light-beam-effect {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: radial-gradient(
            ellipse at bottom,
            rgba(0, 229, 255, 0.2) 0%,
            transparent 70%
          );
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .tab-button.active + .light-beam-effect {
          opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .tab-button {
            transition: none;
          }
          .tab-content {
            animation: none;
          }
        }

        /* Keyboard focus styles */
        .tab-button:focus-visible {
          outline: 2px solid #00e5ff;
          outline-offset: 2px;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .tabs-header {
            flex-direction: column;
            gap: 4px;
          }

          .tab-button {
            padding: 10px 16px;
            font-size: 13px;
          }

          .tab-content {
            padding: 16px;
          }
        }
      `}</style>

      <div className={`projection-tabs-container ${className}`}>
        <div className="tabs-header" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="tab-content"
        >
          {activeTabContent}
        </div>
      </div>
    </>
  );
}
