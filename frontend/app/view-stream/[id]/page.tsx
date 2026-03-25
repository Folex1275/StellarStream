"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * View Stream Page
 * Issue #436 - "Stream Share" Social Preview
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Public read-only view of a stream that shows the flow counter without
 * requiring wallet login. This allows users to share a "Public Link" to
 * prove they are being paid or are paying someone.
 * 
 * URL pattern: stellarstream.app/view/:id
 */

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowRight, Clock, TrendingUp, AlertCircle } from "lucide-react";

// Stream data interface
interface StreamData {
  id: string;
  name: string;
  token: string;
  status: "active" | "paused" | "ended";
  totalAmount: number;
  streamed: number;
  ratePerSecond: number;
  sender: string;
  receiver: string;
  startTime: Date;
  endTime: Date;
}

// Mock data fetch - in production, this would fetch from the API
async function fetchStreamData(id: string): Promise<StreamData | null> {
  // Simulated API call
  // In production: const response = await fetch(`/api/streams/${id}`);
  
  // Mock data for demo
  return {
    id,
    name: "DAO Treasury → Dev Fund",
    token: "USDC",
    status: "active",
    totalAmount: 120000,
    streamed: 37500,
    ratePerSecond: 0.03858,
    sender: "GDAO1...3A2F",
    receiver: "GDEV9...7BC1",
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 48),
  };
}

// Live counter component
function LiveCounter({ base, rate }: { base: number; rate: number }) {
  const [val, setVal] = useState(base);
  
  useEffect(() => {
    if (rate === 0) return;
    const id = setInterval(() => setVal((v) => v + rate * 0.1), 100);
    return () => clearInterval(id);
  }, [rate]);
  
  return <>{val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
}

export default function ViewStreamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [stream, setStream] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStream = async () => {
      try {
        setLoading(true);
        const data = await fetchStreamData(resolvedParams.id);
        
        if (!data) {
          setError("Stream not found");
          return;
        }
        
        setStream(data);
      } catch (err) {
        setError("Failed to load stream");
      } finally {
        setLoading(false);
      }
    };

    loadStream();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00f5ff]/30 border-t-[#00f5ff] rounded-full animate-spin" />
          <p style={{ fontFamily: "Outfit, sans-serif" }} className="text-white/50 text-sm">
            Loading stream...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md p-8">
          <AlertCircle className="w-16 h-16 text-red-500/50" />
          <h1 style={{ fontFamily: "Outfit, sans-serif" }} className="text-2xl font-bold text-white">
            Stream Not Found
          </h1>
          <p style={{ fontFamily: "Outfit, sans-serif" }} className="text-white/40">
            The stream you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="/"
            style={{
              fontFamily: "Outfit, sans-serif",
            }}
            className="mt-4 px-6 py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/30 rounded-xl text-[#00f5ff] hover:bg-[#00f5ff]/20 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const percentComplete = (stream.streamed / stream.totalAmount) * 100;
  const daysLeft = Math.ceil((stream.endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isActive = stream.status === "active";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');

        .view-stream-page {
          min-height: 100vh;
          background: #030303;
          padding: 40px 20px;
          font-family: 'Outfit', sans-serif;
        }

        .stream-card {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .stream-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .stream-id {
          font-size: 11px;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
        }

        .stream-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stream-status.active {
          background: rgba(0, 245, 255, 0.1);
          border: 1px solid rgba(0, 245, 255, 0.3);
          color: #00f5ff;
        }

        .stream-status.paused {
          background: rgba(255, 107, 43, 0.1);
          border: 1px solid rgba(255, 107, 43, 0.3);
          color: #ff6b2b;
        }

        .stream-status.ended {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.5);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .stream-status.active .status-dot {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .stream-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }

        .stream-flow {
          margin: 32px 0;
          text-align: center;
        }

        .flow-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.35);
          margin-bottom: 12px;
        }

        .flow-amount {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 48px;
          font-weight: 700;
          color: #00f5ff;
          line-height: 1;
        }

        .flow-token {
          font-size: 18px;
          font-weight: 400;
          color: rgba(0, 245, 255, 0.6);
          margin-left: 8px;
        }

        .flow-rate {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Progress Bar */
        .progress-container {
          margin: 32px 0;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00f5ff, #8a00ff);
          border-radius: 4px;
          transition: width 1s ease-out;
        }

        /* Stream Details */
        .stream-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-label {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.3);
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .detail-value.address {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
        }

        /* Footer */
        .stream-footer {
          margin-top: 32px;
          text-align: center;
        }

        .stellarstream-brand {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.25);
        }

        .stellarstream-brand a {
          color: #00f5ff;
          text-decoration: none;
        }
      `}</style>

      <div className="view-stream-page">
        <motion.div
          className="stream-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="stream-header">
            <span className="stream-id">{stream.id}</span>
            <div className={`stream-status ${stream.status}`}>
              {isActive && <span className="status-dot" />}
              {stream.status}
            </div>
          </div>

          {/* Title */}
          <h1 className="stream-title">{stream.name}</h1>

          {/* Flow Counter */}
          <div className="stream-flow">
            <p className="flow-label">Total Streamed</p>
            <div className="flex items-baseline justify-center">
              <span className="flow-amount">
                <LiveCounter base={stream.streamed} rate={isActive ? stream.ratePerSecond : 0} />
              </span>
              <span className="flow-token">{stream.token}</span>
            </div>
            {isActive && (
              <div className="flow-rate">
                <TrendingUp className="w-4 h-4" />
                +{stream.ratePerSecond.toFixed(5)} {stream.token}/sec
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="progress-container">
            <div className="progress-header">
              <span>{percentComplete.toFixed(1)}% complete</span>
              <span>{stream.totalAmount.toLocaleString()} {stream.token}</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${percentComplete}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="stream-details">
            <div className="detail-item">
              <span className="detail-label">Sender</span>
              <span className="detail-value address">{stream.sender}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Receiver</span>
              <span className="detail-value address">{stream.receiver}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time Remaining</span>
              <span className="detail-value">{daysLeft > 0 ? `${daysLeft} days` : "Ended"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Rate</span>
              <span className="detail-value">{(stream.ratePerSecond * 86400).toFixed(2)} {stream.token}/day</span>
            </div>
          </div>

          {/* Footer */}
          <div className="stream-footer">
            <p className="stellarstream-brand">
              Powered by <a href="https://stellarstream.app">StellarStream</a>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}