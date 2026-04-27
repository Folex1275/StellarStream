"use client";

import { useState, useEffect } from "react";

interface StreamSummaryCardProps {
  sender: {
    address: string;
    avatar?: string;
    label?: string;
  };
  receiver: {
    address: string;
    avatar?: string;
    label?: string;
  };
  token: string;
  tokenSymbol: string;
  amountStreamed: number;
  totalAmount: number;
  startTime: Date;
  endTime: Date;
  onViewDetails?: () => void;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function Avatar({
  address,
  avatar,
  label,
  size = 40,
}: {
  address: string;
  avatar?: string;
  label?: string;
  size?: number;
}) {
  const seed = address.slice(2, 8);
  const hue = parseInt(seed, 16) % 360;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatar
          ? undefined
          : `conic-gradient(from ${hue}deg, hsl(${hue},80%,55%), hsl(${(hue + 120) % 360},80%,55%), hsl(${(hue + 240) % 360},80%,55%), hsl(${hue},80%,55%))`,
        backgroundImage: avatar ? `url(${avatar})` : undefined,
        backgroundSize: "cover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Mono', monospace",
        fontSize: size * 0.3,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
        position: "relative",
      }}
      title={label || address}
    >
      {!avatar && (label ? label[0].toUpperCase() : address[2].toUpperCase())}
    </div>
  );
}

export default function StreamSummaryCard({
  sender = {
    address: "0xA1b2C3d4E5f6789012345678901234567890abcd",
    label: "Alice",
  },
  receiver = {
    address: "0xB2c3D4e5F6a7890123456789012345678901bcde",
    label: "Bob",
  },
  token = "USDC",
  tokenSymbol = "USDC",
  amountStreamed = 342.75,
  totalAmount = 1000,
  startTime = new Date(Date.now() - 86400000 * 3),
  endTime = new Date(Date.now() + 86400000 * 7),
  onViewDetails,
}: Partial<StreamSummaryCardProps> = {}) {
  const [liveStreamed, setLiveStreamed] = useState(amountStreamed);
  const [hovered, setHovered] = useState(false);

  // Simulate live streaming increment
  useEffect(() => {
    const total = endTime.getTime() - startTime.getTime();
    const elapsed = Date.now() - startTime.getTime();
    const ratePerMs = totalAmount / total;

    const interval = setInterval(() => {
      const newElapsed = Date.now() - startTime.getTime();
      const newAmount = Math.min(ratePerMs * newElapsed, totalAmount);
      setLiveStreamed(newAmount);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, endTime, totalAmount]);

  const progress = Math.min((liveStreamed / totalAmount) * 100, 100);

  const now = Date.now();
  const totalDuration = endTime.getTime() - startTime.getTime();
  const elapsed = now - startTime.getTime();
  const remaining = endTime.getTime() - now;
  const daysRemaining = Math.max(0, Math.floor(remaining / 86400000));
  const hoursRemaining = Math.max(0, Math.floor((remaining % 86400000) / 3600000));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

        .stream-card {
          position: relative;
          width: 380px;
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 20px;
          padding: 24px;
          font-family: 'Syne', sans-serif;
          color: #e8eaf6;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0, 229, 255, 0.05),
            0 8px 40px rgba(0, 0, 0, 0.6),
            0 0 60px rgba(0, 229, 255, 0.04) inset;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .stream-card {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .stream-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 0%, rgba(0, 229, 255, 0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 100%, rgba(138, 43, 226, 0.08) 0%, transparent 60%);
          pointer-events: none;
          border-radius: 20px;
        }

        .stream-card:hover {
          border-color: rgba(0, 229, 255, 0.3);
          box-shadow:
            0 0 0 1px rgba(0, 229, 255, 0.1),
            0 8px 60px rgba(0, 0, 0, 0.7),
            0 0 80px rgba(0, 229, 255, 0.07) inset;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.25);
          border-radius: 999px;
          padding: 2px 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #00e5ff;
          text-transform: uppercase;
          font-family: 'Space Mono', monospace;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          background: #00e5ff;
          border-radius: 50%;
          animation: pulse-dot 1.5s ease-in-out infinite;
          box-shadow: 0 0 6px #00e5ff;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .token-badge {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(232, 234, 246, 0.5);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 2px 8px;
        }

        .participants-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 18px 0;
        }

        .participant-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .participant-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(232, 234, 246, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .participant-address {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(232, 234, 246, 0.75);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .arrow-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          gap: 2px;
        }

        .arrow-line {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, rgba(0, 229, 255, 0.4), rgba(138, 43, 226, 0.4));
          position: relative;
        }

        .arrow-line::after {
          content: '›';
          position: absolute;
          right: -2px;
          top: -7px;
          color: rgba(138, 43, 226, 0.8);
          font-size: 14px;
        }

        .amounts-section {
          margin: 14px 0;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }

        .amount-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .amount-label {
          font-size: 11px;
          color: rgba(232, 234, 246, 0.4);
          letter-spacing: 0.06em;
        }

        .amount-value {
          font-family: 'Space Mono', monospace;
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .amount-total {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: rgba(232, 234, 246, 0.35);
        }

        .divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 10px 0;
        }

        .progress-section {
          margin: 16px 0 6px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 11px;
          color: rgba(232, 234, 246, 0.4);
          letter-spacing: 0.06em;
        }

        .progress-pct {
          font-family: 'Space Mono', monospace;
          color: #00e5ff;
          font-weight: 700;
        }

        .progress-track {
          position: relative;
          height: 4px;
          background: rgba(255,255,255,0.07);
          border-radius: 999px;
          overflow: visible;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00e5ff, #8a2be2);
          position: relative;
          transition: width 0.1s linear;
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.5), 0 0 24px rgba(138, 43, 226, 0.3);
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          right: -1px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px #00e5ff, 0 0 16px rgba(0, 229, 255, 0.6);
        }

        .time-remaining {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(232, 234, 246, 0.3);
          margin-top: 8px;
          text-align: right;
        }

        .view-details-btn {
          display: block;
          width: 100%;
          margin-top: 18px;
          padding: 11px 0;
          background: rgba(0, 229, 255, 0.06);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 12px;
          color: #00e5ff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .view-details-btn {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stream-card,
          .view-details-btn {
            transition: none;
          }
        }

        .view-details-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(138, 43, 226, 0.12));
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .view-details-btn:hover::before {
          opacity: 1;
        }

        .view-details-btn:hover {
          border-color: rgba(0, 229, 255, 0.5);
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.15), 0 0 40px rgba(138, 43, 226, 0.1);
          transform: translateY(-1px);
          color: #fff;
        }

        .view-details-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="stream-card">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.01em", color: "#e8eaf6" }}>
            Active Stream
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="token-badge">{tokenSymbol}</span>
            <span className="live-badge">
              <span className="live-dot" />
              Live
            </span>
          </div>
        </div>

        {/* Participants */}
        <div className="participants-row">
          <Avatar address={sender.address} avatar={sender.avatar} label={sender.label} size={38} />
          <div className="participant-info" style={{ flex: 1 }}>
            <span className="participant-label">From</span>
            <span className="participant-address">
              {sender.label || truncateAddress(sender.address)}
            </span>
          </div>

          <div className="arrow-divider">
            <div className="arrow-line" />
          </div>

          <div className="participant-info" style={{ flex: 1, alignItems: "flex-end" }}>
            <span className="participant-label">To</span>
            <span className="participant-address">
              {receiver.label || truncateAddress(receiver.address)}
            </span>
          </div>
          <Avatar address={receiver.address} avatar={receiver.avatar} label={receiver.label} size={38} />
        </div>

        {/* Amounts */}
        <div className="amounts-section">
          <div className="amount-row">
            <span className="amount-label">Amount Streamed</span>
            <span className="amount-value">
              {liveStreamed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
          <div className="divider" />
          <div className="amount-row">
            <span className="amount-label">Total</span>
            <span className="amount-total">
              {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {tokenSymbol}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-section">
          <div className="progress-header">
            <span>Stream Progress</span>
            <span className="progress-pct">{progress.toFixed(2)}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.max(progress, 1)}%` }}
            />
          </div>
          <div className="time-remaining">
            {remaining > 0
              ? `${daysRemaining}d ${hoursRemaining}h remaining`
              : "Stream complete"}
          </div>
        </div>

        {/* View Details */}
        <button
          className="view-details-btn"
          onClick={onViewDetails}
        >
          View Details →
        </button>
      </div>
    </>
  );
}