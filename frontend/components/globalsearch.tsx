"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchResult {
  id: string;
  type: "stream" | "recipient" | "token";
  label: string;
  sublabel: string;
  tag: string;
}

interface RecentSearch {
  query: string;
  timestamp: number;
  type: "stream" | "recipient" | "token" | "general";
}

const MOCK_RESULTS: SearchResult[] = [
  { id: "1", type: "stream", label: "Stream #0xA4F2…3C1D", sublabel: "Sending 500 USDC/mo to Alice.stellar", tag: "STREAM" },
  { id: "2", type: "stream", label: "Stream #0xB8E1…7A2F", sublabel: "Vesting 1,200 XLM to dev-fund.stellar", tag: "STREAM" },
  { id: "3", type: "recipient", label: "alice.stellar", sublabel: "0xC3d4E5f6…9012 · 3 active streams", tag: "RECIPIENT" },
  { id: "4", type: "recipient", label: "treasury.stellar", sublabel: "0xD4e5F6a7…0123 · 7 active streams", tag: "RECIPIENT" },
  { id: "5", type: "token", label: "USDC", sublabel: "USD Coin · Circle · 12 streams", tag: "TOKEN" },
  { id: "6", type: "token", label: "XLM", sublabel: "Stellar Lumens · Native · 8 streams", tag: "TOKEN" },
  { id: "7", type: "token", label: "yXLM", sublabel: "Yield-bearing XLM · Stellar · 4 streams", tag: "TOKEN" },
];

const INITIAL_RECENTS: RecentSearch[] = [
  { query: "alice.stellar", timestamp: Date.now() - 60000, type: "recipient" },
  { query: "Stream #0xA4F2", timestamp: Date.now() - 3600000, type: "stream" },
  { query: "USDC", timestamp: Date.now() - 86400000, type: "token" },
];

const TYPE_COLORS: Record<string, string> = {
  stream: "#00e5ff",
  recipient: "#a78bfa",
  token: "#34d399",
  general: "rgba(255,255,255,0.4)",
};

const TYPE_ICONS: Record<string, string> = {
  stream: "⟳",
  recipient: "◈",
  token: "◎",
  general: "↺",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recents, setRecents] = useState<RecentSearch[]>(INITIAL_RECENTS);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [scanLine, setScanLine] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<number>(0);

  // Scan line animation
  useEffect(() => {
    if (!focused) return;
    const id = setInterval(() => {
      scanRef.current = (scanRef.current + 1) % 100;
      setScanLine(scanRef.current);
    }, 16);
    return () => clearInterval(id);
  }, [focused]);

  // Filter results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }
    const q = query.toLowerCase();
    const filtered = MOCK_RESULTS.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.sublabel.toLowerCase().includes(q) ||
        r.tag.toLowerCase().includes(q)
    );
    setResults(filtered);
    setActiveIndex(-1);
  }, [query]);

  // CMD+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setFocused(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? results : recents;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        const item = query ? results[activeIndex] : recents[activeIndex];
        if (item) handleSelect(query ? (item as SearchResult).label : (item as RecentSearch).query);
      } else if (query.trim()) {
        handleSelect(query);
      }
    }
  };

  const handleSelect = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.query !== q).slice(0, 4);
      return [{ query: q, timestamp: Date.now(), type: "general" }, ...filtered];
    });
    setQuery(q);
    setFocused(false);
    inputRef.current?.blur();
  }, []);

  const removeRecent = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecents((prev) => prev.filter((r) => r.query !== q));
  };

  const showDropdown = focused && (results.length > 0 || (query === "" && recents.length > 0));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .gs-backdrop {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(0,229,255,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(138,43,226,0.07) 0%, transparent 50%),
            #070a10;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 24px 24px;
          font-family: 'Syne', sans-serif;
        }

        .gs-wrapper {
          width: 100%;
          max-width: 680px;
          position: relative;
        }

        /* ── Search Container ── */
        .gs-container {
          position: relative;
          width: 100%;
        }

        /* Outer glow ring — animated when focused */
        .gs-glow-ring {
          position: absolute;
          inset: -1px;
          border-radius: 16px;
          pointer-events: none;
          transition: opacity 0.35s ease, box-shadow 0.35s ease;
          opacity: 0;
        }

        .gs-container.focused .gs-glow-ring {
          opacity: 1;
          box-shadow:
            0 0 0 1px rgba(0,229,255,0.4),
            0 0 24px rgba(0,229,255,0.2),
            0 0 60px rgba(0,229,255,0.08);
        }

        /* Scan line that sweeps across when focused */
        .gs-scan {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, transparent, rgba(0,229,255,0.6), transparent);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: 1px;
          z-index: 5;
        }

        .gs-container.focused .gs-scan {
          opacity: 1;
        }

        /* Main glass input track */
        .gs-track {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(10, 12, 22, 0.90);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 0 16px;
          height: 52px;
          transition: background 0.25s ease, border-color 0.25s ease;
          overflow: hidden;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .gs-track {
            background: rgba(255,255,255,0.04);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        /* Frosted inner gradient */
        .gs-track::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.01) 50%,
            rgba(0,229,255,0.02) 100%
          );
          pointer-events: none;
        }

        .gs-container.focused .gs-track {
          background: rgba(0,229,255,0.04);
          border-color: rgba(0,229,255,0.28);
        }

        /* Search icon */
        .gs-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: color 0.25s ease, filter 0.25s ease;
          color: rgba(255,255,255,0.25);
          z-index: 2;
        }

        .gs-container.focused .gs-icon {
          color: #00e5ff;
          filter: drop-shadow(0 0 6px rgba(0,229,255,0.6));
        }

        /* Input */
        .gs-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          font-weight: 400;
          color: rgba(232,234,246,0.9);
          letter-spacing: 0.02em;
          caret-color: #00e5ff;
          z-index: 2;
          position: relative;
        }

        .gs-input::placeholder {
          color: rgba(255,255,255,0.22);
          font-style: italic;
        }

        /* CMD+K badge */
        .gs-kbd-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
          z-index: 2;
          transition: opacity 0.2s;
        }

        .gs-container.focused .gs-kbd-badge {
          opacity: 0.4;
        }

        .gs-kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 5px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.04em;
          line-height: 1;
          white-space: nowrap;
        }

        .gs-kbd-sep {
          color: rgba(255,255,255,0.2);
          font-size: 9px;
          font-family: 'DM Mono', monospace;
        }

        /* Clear button */
        .gs-clear {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          font-size: 11px;
          line-height: 1;
          flex-shrink: 0;
          z-index: 2;
          transition: all 0.15s;
          padding: 0;
        }

        .gs-clear:hover {
          background: rgba(255,80,80,0.15);
          border-color: rgba(255,80,80,0.3);
          color: #ff6060;
        }

        /* ── Dropdown ── */
        .gs-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(7, 10, 18, 0.97);
          border: 1px solid rgba(0,229,255,0.15);
          border-radius: 14px;
          overflow: hidden;
          box-shadow:
            0 20px 60px rgba(0,0,0,0.7),
            0 0 0 1px rgba(255,255,255,0.04) inset;
          z-index: 100;
          animation: dropIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .gs-dropdown {
            background: rgba(7, 10, 18, 0.92);
            backdrop-filter: blur(28px);
            -webkit-backdrop-filter: blur(28px);
          }
        }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .gs-track,
          .gs-icon,
          .gs-clear,
          .gs-item {
            transition: none;
          }
          .gs-dropdown {
            animation: none;
          }
        }

        /* Section header */
        .gs-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px 6px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.22);
        }

        .gs-section-action {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(0,229,255,0.5);
          cursor: pointer;
          background: none;
          border: none;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.15s;
          font-family: 'Syne', sans-serif;
        }

        .gs-section-action:hover {
          color: #00e5ff;
          background: rgba(0,229,255,0.08);
        }

        .gs-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 0 12px;
        }

        /* Result / Recent items */
        .gs-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.12s ease;
          position: relative;
          text-decoration: none;
        }

        .gs-item:hover,
        .gs-item.active {
          background: rgba(255,255,255,0.04);
        }

        .gs-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 4px;
          bottom: 4px;
          width: 2px;
          background: #00e5ff;
          border-radius: 0 1px 1px 0;
          box-shadow: 0 0 6px rgba(0,229,255,0.6);
        }

        /* Icon bubble */
        .gs-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          border: 1px solid;
          transition: box-shadow 0.15s;
        }

        .gs-item:hover .gs-item-icon,
        .gs-item.active .gs-item-icon {
          box-shadow: 0 0 10px currentColor;
        }

        /* Text stack */
        .gs-item-text {
          flex: 1;
          min-width: 0;
        }

        .gs-item-label {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          color: rgba(232,234,246,0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .gs-item-sublabel {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px;
          color: rgba(255,255,255,0.28);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.4;
          margin-top: 1px;
          font-style: italic;
        }

        /* Type tag pill */
        .gs-tag {
          font-family: 'DM Mono', monospace;
          font-size: 8.5px;
          font-weight: 500;
          letter-spacing: 0.1em;
          padding: 2px 7px;
          border-radius: 999px;
          border: 1px solid;
          flex-shrink: 0;
        }

        /* Recent item arrow */
        .gs-recent-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .gs-time {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.2);
          white-space: nowrap;
        }

        .gs-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: none;
          color: rgba(255,255,255,0.2);
          cursor: pointer;
          font-size: 9px;
          line-height: 1;
          padding: 0;
          transition: all 0.15s;
        }

        .gs-remove:hover {
          border-color: rgba(255,80,80,0.4);
          color: #ff6060;
          background: rgba(255,80,80,0.1);
        }

        /* Empty state */
        .gs-empty {
          padding: 24px 16px;
          text-align: center;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          font-style: italic;
        }

        .gs-empty-icon {
          display: block;
          font-size: 22px;
          margin-bottom: 8px;
          opacity: 0.3;
        }

        /* Footer hint */
        .gs-footer {
          padding: 8px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(0,0,0,0.2);
        }

        .gs-hint {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.2);
        }

        .gs-hint-kbd {
          padding: 1px 5px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 3px;
          font-size: 9px;
          color: rgba(255,255,255,0.3);
          line-height: 1.4;
        }
      `}</style>

      <div className="gs-backdrop">
        <div className="gs-wrapper">
          <div className={`gs-container${focused ? " focused" : ""}`}>
            {/* Animated scan line */}
            <div
              className="gs-scan"
              style={{ left: `${scanLine}%`, opacity: focused ? 0.6 : 0 }}
            />

            {/* Outer glow ring */}
            <div className="gs-glow-ring" />

            {/* Main input track */}
            <div className="gs-track">
              {/* Search icon — Electric Cyan when focused */}
              <div className="gs-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>

              <input
                ref={inputRef}
                className="gs-input"
                type="text"
                placeholder="Search streams, recipients, tokens…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onKeyDown={handleKeyDown}
                aria-label="Global search"
                autoComplete="off"
                spellCheck={false}
              />

              {/* CMD + K badge */}
              {!query && (
                <div className="gs-kbd-badge" aria-label="Keyboard shortcut: Command K">
                  <span className="gs-kbd">⌘</span>
                  <span className="gs-kbd-sep">+</span>
                  <span className="gs-kbd">K</span>
                </div>
              )}

              {/* Clear button */}
              {query && (
                <button
                  className="gs-clear"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                  tabIndex={-1}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="gs-dropdown" ref={dropdownRef} role="listbox">
                {/* Search results */}
                {query && results.length > 0 && (
                  <>
                    <div className="gs-section-header">
                      <span>Results</span>
                      <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 9 }}>
                        {results.length} found
                      </span>
                    </div>
                    {results.map((r, i) => {
                      const color = TYPE_COLORS[r.type];
                      const icon = TYPE_ICONS[r.type];
                      return (
                        <div
                          key={r.id}
                          className={`gs-item${activeIndex === i ? " active" : ""}`}
                          role="option"
                          aria-selected={activeIndex === i}
                          onMouseDown={() => handleSelect(r.label)}
                          onMouseEnter={() => setActiveIndex(i)}
                        >
                          <div
                            className="gs-item-icon"
                            style={{
                              color,
                              borderColor: `${color}30`,
                              background: `${color}10`,
                            }}
                          >
                            {icon}
                          </div>
                          <div className="gs-item-text">
                            <div className="gs-item-label">{r.label}</div>
                            <div className="gs-item-sublabel">{r.sublabel}</div>
                          </div>
                          <span
                            className="gs-tag"
                            style={{ color, borderColor: `${color}35`, background: `${color}0e` }}
                          >
                            {r.tag}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* No results */}
                {query && results.length === 0 && (
                  <div className="gs-empty">
                    <span className="gs-empty-icon">◌</span>
                    No results for "{query}"
                  </div>
                )}

                {/* Recent searches */}
                {!query && recents.length > 0 && (
                  <>
                    <div className="gs-section-header">
                      <span>Recent Searches</span>
                      <button
                        className="gs-section-action"
                        onMouseDown={() => setRecents([])}
                        tabIndex={-1}
                      >
                        Clear all
                      </button>
                    </div>
                    {recents.map((r, i) => {
                      const color = TYPE_COLORS[r.type];
                      const icon = TYPE_ICONS[r.type];
                      return (
                        <div
                          key={r.query + i}
                          className={`gs-item${activeIndex === i ? " active" : ""}`}
                          role="option"
                          aria-selected={activeIndex === i}
                          onMouseDown={() => handleSelect(r.query)}
                          onMouseEnter={() => setActiveIndex(i)}
                        >
                          <div
                            className="gs-item-icon"
                            style={{
                              color,
                              borderColor: `${color}25`,
                              background: `${color}08`,
                            }}
                          >
                            {icon}
                          </div>
                          <div className="gs-item-text">
                            <div className="gs-item-label">{r.query}</div>
                          </div>
                          <div className="gs-recent-meta">
                            <span className="gs-time">{timeAgo(r.timestamp)}</span>
                            <button
                              className="gs-remove"
                              onMouseDown={(e) => removeRecent(r.query, e)}
                              aria-label={`Remove ${r.query} from recent searches`}
                              tabIndex={-1}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Keyboard nav footer */}
                <div className="gs-footer">
                  <span className="gs-hint">
                    <span className="gs-hint-kbd">↑↓</span>
                    navigate
                  </span>
                  <span className="gs-hint">
                    <span className="gs-hint-kbd">↵</span>
                    select
                  </span>
                  <span className="gs-hint">
                    <span className="gs-hint-kbd">Esc</span>
                    close
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}