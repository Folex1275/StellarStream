"use client";

import { useEffect, useState } from "react";
import { useMultipleLoadingStates } from "@/lib/use-loading-state";
import NebulaSkeleton from "./nebula-skeleton";
import StreamSummaryCard from "./streamsummarycard";

/**
 * Example: Stream List with Smart Loading States
 * Demonstrates best practices for loading states with Nebula Skeleton
 */

interface Stream {
  id: string;
  sender: { address: string; label?: string };
  receiver: { address: string; label?: string };
  token: string;
  tokenSymbol: string;
  amountStreamed: number;
  totalAmount: number;
  startTime: Date;
  endTime: Date;
}

// Simulated API calls
const fetchActiveStreams = async (): Promise<Stream[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return [
    {
      id: "1",
      sender: { address: "0xA1b2C3d4E5f6789012345678901234567890abcd", label: "Alice" },
      receiver: { address: "0xB2c3D4e5F6a7890123456789012345678901bcde", label: "Bob" },
      token: "USDC",
      tokenSymbol: "USDC",
      amountStreamed: 342.75,
      totalAmount: 1000,
      startTime: new Date(Date.now() - 86400000 * 3),
      endTime: new Date(Date.now() + 86400000 * 7),
    },
    {
      id: "2",
      sender: { address: "0xC3d4E5f6A7b8901234567890123456789012cdef", label: "Charlie" },
      receiver: { address: "0xD4e5F6a7B8c9012345678901234567890123def0", label: "Diana" },
      token: "USDT",
      tokenSymbol: "USDT",
      amountStreamed: 1250.50,
      totalAmount: 5000,
      startTime: new Date(Date.now() - 86400000 * 5),
      endTime: new Date(Date.now() + 86400000 * 10),
    },
  ];
};

const fetchCompletedStreams = async (): Promise<Stream[]> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return [
    {
      id: "3",
      sender: { address: "0xE5f6A7b8C9d0123456789012345678901234ef01", label: "Eve" },
      receiver: { address: "0xF6a7B8c9D0e1234567890123456789012345f012", label: "Frank" },
      token: "XLM",
      tokenSymbol: "XLM",
      amountStreamed: 10000,
      totalAmount: 10000,
      startTime: new Date(Date.now() - 86400000 * 30),
      endTime: new Date(Date.now() - 86400000 * 1),
    },
  ];
};

const fetchPausedStreams = async (): Promise<Stream[]> => {
  await new Promise(resolve => setTimeout(resolve, 1800));
  return [];
};

export default function StreamListWithLoading() {
  const loading = useMultipleLoadingStates(['active', 'completed', 'paused'], 300);
  
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [completedStreams, setCompletedStreams] = useState<Stream[]>([]);
  const [pausedStreams, setPausedStreams] = useState<Stream[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadStreams = async () => {
    try {
      setError(null);

      // Load active streams
      loading.setLoading('active', true);
      fetchActiveStreams()
        .then(setActiveStreams)
        .catch(err => setError(err.message))
        .finally(() => loading.setLoading('active', false));

      // Load completed streams (independent timing)
      loading.setLoading('completed', true);
      fetchCompletedStreams()
        .then(setCompletedStreams)
        .catch(err => setError(err.message))
        .finally(() => loading.setLoading('completed', false));

      // Load paused streams
      loading.setLoading('paused', true);
      fetchPausedStreams()
        .then(setPausedStreams)
        .catch(err => setError(err.message))
        .finally(() => loading.setLoading('paused', false));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streams');
    }
  };

  useEffect(() => {
    loadStreams();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        .stream-list-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #050510 0%, #0a0a14 100%);
          padding: 60px 40px;
          font-family: 'Syne', sans-serif;
        }

        .page-header {
          max-width: 1400px;
          margin: 0 auto 48px;
        }

        .page-title {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 18px;
          color: rgba(232, 234, 246, 0.6);
          margin-bottom: 24px;
        }

        .page-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .refresh-button {
          padding: 12px 24px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 12px;
          color: #00e5ff;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .refresh-button:hover {
          background: rgba(0, 229, 255, 0.15);
          border-color: rgba(0, 229, 255, 0.5);
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
          transform: translateY(-2px);
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .loading-indicator {
          padding: 8px 16px;
          background: rgba(138, 43, 226, 0.1);
          border: 1px solid rgba(138, 43, 226, 0.3);
          border-radius: 8px;
          color: #8a2be2;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(138, 43, 226, 0.3);
          border-top-color: #8a2be2;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .section {
          margin-bottom: 48px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: rgba(232, 234, 246, 0.9);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-count {
          padding: 4px 12px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #00e5ff;
        }

        .streams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 32px;
        }

        .empty-state {
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 48px;
          text-align: center;
          color: rgba(232, 234, 246, 0.6);
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .empty-state {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .error-state {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 16px;
          padding: 24px;
          color: #ff6b6b;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .stream-list-page {
            padding: 40px 20px;
          }

          .page-title {
            font-size: 36px;
          }

          .streams-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="stream-list-page">
        <div className="page-header">
          <h1 className="page-title">My Streams</h1>
          <p className="page-subtitle">
            Manage your active, completed, and paused payment streams
          </p>
          
          <div className="page-actions">
            <button
              className="refresh-button"
              onClick={loadStreams}
              disabled={loading.isAnyLoading()}
            >
              🔄 Refresh All
            </button>
            
            {loading.isAnyLoading() && (
              <div className="loading-indicator">
                <div className="spinner" />
                Loading...
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="error-state">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="page-content">
          {/* Active Streams Section */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">
                Active Streams
                {!loading.isLoading('active') && (
                  <span className="section-count">{activeStreams.length}</span>
                )}
              </h2>
            </div>

            <div className="streams-grid">
              {loading.isLoading('active') ? (
                <>
                  <NebulaSkeleton variant="card" />
                  <NebulaSkeleton variant="card" />
                  <NebulaSkeleton variant="card" />
                </>
              ) : activeStreams.length > 0 ? (
                activeStreams.map((stream) => (
                  <StreamSummaryCard key={stream.id} {...stream} />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">💤</div>
                  <div>No active streams</div>
                </div>
              )}
            </div>
          </section>

          {/* Completed Streams Section */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">
                Completed Streams
                {!loading.isLoading('completed') && (
                  <span className="section-count">{completedStreams.length}</span>
                )}
              </h2>
            </div>

            <div className="streams-grid">
              {loading.isLoading('completed') ? (
                <>
                  <NebulaSkeleton variant="card" />
                  <NebulaSkeleton variant="card" />
                </>
              ) : completedStreams.length > 0 ? (
                completedStreams.map((stream) => (
                  <StreamSummaryCard key={stream.id} {...stream} />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div>No completed streams</div>
                </div>
              )}
            </div>
          </section>

          {/* Paused Streams Section */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">
                Paused Streams
                {!loading.isLoading('paused') && (
                  <span className="section-count">{pausedStreams.length}</span>
                )}
              </h2>
            </div>

            <div className="streams-grid">
              {loading.isLoading('paused') ? (
                <NebulaSkeleton variant="card" />
              ) : pausedStreams.length > 0 ? (
                pausedStreams.map((stream) => (
                  <StreamSummaryCard key={stream.id} {...stream} />
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">⏸️</div>
                  <div>No paused streams</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
