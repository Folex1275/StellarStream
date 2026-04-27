"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExpiryCountdownProps {
  /** The expiration date/time of the proposal */
  expiresAt: Date;
  /** Whether the proposal is fully signed (completed) */
  isCompleted?: boolean;
  /** Optional custom className for the container */
  className?: string;
  /** Show icon alongside the countdown */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  green: {
    text: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    glow: "rgba(16, 185, 129, 0.2)",
  },
  orange: {
    text: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.3)",
    glow: "rgba(245, 158, 11, 0.2)",
  },
  red: {
    text: "#ef4444",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
    glow: "rgba(239, 68, 68, 0.2)",
  },
  expired: {
    text: "#dc2626",
    bg: "rgba(220, 38, 38, 0.15)",
    border: "rgba(220, 38, 38, 0.5)",
    glow: "rgba(220, 38, 38, 0.3)",
  },
  completed: {
    text: "#00f5ff",
    bg: "rgba(0, 245, 255, 0.1)",
    border: "rgba(0, 245, 255, 0.3)",
    glow: "rgba(0, 245, 255, 0.2)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate time remaining and return formatted string + urgency level
 */
function calculateTimeRemaining(expiresAt: Date): {
  text: string;
  milliseconds: number;
  urgency: "green" | "orange" | "red" | "expired";
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = Date.now();
  const expiry = expiresAt.getTime();
  const ms = expiry - now;

  if (ms <= 0) {
    return {
      text: "Expired",
      milliseconds: ms,
      urgency: "expired",
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Determine urgency based on time remaining
  let urgency: "green" | "orange" | "red";
  let text: string;

  if (hours >= 24) {
    // More than 24 hours - Green
    urgency = "green";
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    text = remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  } else if (hours >= 6) {
    // 6-24 hours - Orange
    urgency = "orange";
    text = `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    // 1-6 hours - Red
    urgency = "red";
    text = `${hours}h ${minutes}m`;
  } else {
    // Less than 1 hour - Red (urgent)
    urgency = "red";
    text = `${minutes}m ${seconds}s`;
  }

  return {
    text,
    milliseconds: ms,
    urgency,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Get color scheme based on urgency level
 */
function getColorScheme(urgency: string, isCompleted: boolean) {
  if (isCompleted) return COLORS.completed;
  return COLORS[urgency as keyof typeof COLORS] || COLORS.green;
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes expiryPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  @keyframes expiredPulse {
    0%, 100% { box-shadow: 0 0 10px rgba(220, 38, 38, 0.3); }
    50% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.6), 0 0 30px rgba(220, 38, 38, 0.3); }
  }
  
  @keyframes urgentGlow {
    0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.2); }
    50% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.4), 0 0 24px rgba(239, 68, 68, 0.2); }
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExpiryCountdown({
  expiresAt,
  isCompleted = false,
  className = "",
  showIcon = true,
  size = "md",
}: ExpiryCountdownProps) {
  const [timeInfo, setTimeInfo] = useState(() => calculateTimeRemaining(expiresAt));
  const [tick, setTick] = useState(0);

  // Update countdown every second
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setTimeInfo(calculateTimeRemaining(expiresAt));
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isCompleted]);

  const colorScheme = useMemo(
    () => getColorScheme(timeInfo.urgency, isCompleted),
    [timeInfo.urgency, isCompleted]
  );

  const isExpired = timeInfo.urgency === "expired";
  const isUrgent = timeInfo.urgency === "red" && !isExpired;

  // Size configurations
  const sizeConfig = {
    sm: {
      fontSize: "10px",
      padding: "4px 8px",
      iconSize: 9,
    },
    md: {
      fontSize: "11px",
      padding: "6px 10px",
      iconSize: 10,
    },
    lg: {
      fontSize: "13px",
      padding: "8px 14px",
      iconSize: 12,
    },
  };

  const config = sizeConfig[size];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: config.padding,
          borderRadius: "9999px",
          border: `1px solid ${colorScheme.border}`,
          background: colorScheme.bg,
          color: colorScheme.text,
          fontSize: config.fontSize,
          fontFamily: "'DM Mono', monospace",
          fontWeight: 600,
          letterSpacing: "0.05em",
          transition: "all 0.3s ease",
          animation: isExpired
            ? "expiredPulse 2s ease-in-out infinite"
            : isUrgent
            ? "urgentGlow 1.5s ease-in-out infinite"
            : undefined,
        }}
      >
        {showIcon && (
          <span
            style={{
              display: "inline-flex",
              animation: isUrgent || isExpired ? "expiryPulse 1s ease-in-out infinite" : undefined,
            }}
          >
            {isExpired ? <AlertTriangle size={config.iconSize} /> : <Clock size={config.iconSize} />}
          </span>
        )}
        <span>{timeInfo.text}</span>
      </div>
    </>
  );
}
