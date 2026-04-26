"use client";

import { useState, useEffect } from "react";
import LiquidLevelProgressRing from "./liquid-level-progress-ring";

interface StreamCardWithLiquidRingProps {
  streamId: string;
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
  size = 32,
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
      }}
      title={label || address}
    >
      {!avatar && (label ? label[0].toUpperCase() : address[2].toUpperCase())}
    </div>
  );
}

export default function StreamCardWithLiquidRing({
  streamId,
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
}: Partial<StreamCardWithLiquidRingProps> = {}) {
  const [liveStreamed, setLiveStreamed] = useState(amountStreamed);

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

  const remaining = endTime.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.floor(remaining / 86400000));
  const hoursRemaining = Math.max(0, Math.floor((remaining % 86400000) / 3600000));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

        .liquid-stream-card {
          position: relative;
          width: 320px;
          background: rgba(10, 10, 20, 0.85);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 20px;
          padding: 20px;
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
          .liquid-stream-card {
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .liquid-stream-card {
            transition: none;
          }
        }

        .liquid-stream-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 0%, rgba(0, 229, 255, 0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 100%, rgba(138, 43, 226, 0.08) 0%, transparent 60%);
          pointer-events: none;
          border-radius: 20px;
        }

        .liquid-stream-card:hover {
          border-color: rgba(0, 229, 255, 0.3);
          box-shadow:
            0 0 0 1px rgba(0, 229, 255, 0.1),
            0 8px 60px rgba(0, 0, 0, 0.7),
            0 0 80px rgba(0, 229, 255, 0.07) inset;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .stream-title {
          font-size: 14px;
          font-weight: 800;
          color: #e8eaf6;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.25);
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #00e5ff;
          text-transform: uppercase;
          font-family: 'Space Mono', monospace;
        }

        .live-dot {
          width: 4px;
          height: 4px;
          background: #00e5ff;
          border-radius: 50%;
          animation: pulse-dot 1.5s ease-in-out infinite;
          box-shadow: 0 0 4px #00e5ff;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .progress-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 16px 0;
        }

        .participants-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .participant-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .participant-label {
          font-size: 9px;
          font-weight: 600;
          color: rgba(232, 234, 246, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          width: 24px;
        }

        .participant-address {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(232, 234, 246, 0.75);
        }

        .amount-section {
          margin: 16px 0;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          text-align: center;
        }

        .amount-streamed {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #00e5ff, #8a2be2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
        }

        .amount-total {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(232, 234, 246, 0.35);
        }

        .time-remaining {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(232, 234, 246, 0.3);
          text-align: center;
          margin-top: 12px;
        }
      `}</style>

      <div className="liquid-stream-card">
        {/* Header */}
        <div className="card-header">
          <div className="stream-title">Stream #{streamId || "001"}</div>
          <span className="live-badge">
            <span className="live-dot" />
            Live
          </span>
        </div>

        {/* Progress Section with Liquid Ring */}
        <div className="progress-section">
          <div className="participants-info">
            <div className="participant-row">
              <span className="participant-label">From</span>
              <Avatar address={sender.address} avatar={sender.avatar} label={sender.label} size={24} />
              <span className="participant-address">
                {sender.label || truncateAddress(sender.address)}
              </span>
            </div>
            <div className="participant-row">
              <span className="participant-label">To</span>
              <Avatar address={receiver.address} avatar={receiver.avatar} label={receiver.label} size={24} />
              <span className="participant-address">
                {receiver.label || truncateAddress(receiver.address)}
              </span>
            </div>
          </div>

          {/* Liquid Level Progress Ring */}
          <LiquidLevelProgressRing 
            progress={progress} 
            size={80} 
            strokeWidth={6}
            showPercentage={true}
          />
        </div>

        {/* Amount Section */}
        <div className="amount-section">
          <div className="amount-streamed">
            {liveStreamed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {tokenSymbol}
          </div>
          <div className="amount-total">
            of {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {tokenSymbol}
          </div>
        </div>

        {/* Time Remaining */}
        <div className="time-remaining">
          {remaining > 0
            ? `${daysRemaining}d ${hoursRemaining}h remaining`
            : "Stream complete"}
        </div>
      </div>
    </>
  );
}