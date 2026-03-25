"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { calculateSimpleYield } from "@/lib/yield-calculator";

interface YieldComparisonChartProps {
  totalAmount: number;
  streamed: number;
  ratePerSecond: number;
  startTime: Date;
  endTime: Date;
  apy: number; // Annual percentage yield as decimal (e.g., 0.08 for 8%)
  token: string;
}

type ProjectionType = "daily" | "weekly" | "monthly";

export default function YieldComparisonChart({
  totalAmount,
  streamed,
  ratePerSecond,
  startTime,
  endTime,
  apy,
  token,
}: YieldComparisonChartProps) {
  const [projection, setProjection] = useState<ProjectionType>("daily");

  const data = useMemo(() => {
    const now = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    const remaining = totalDuration - elapsed;

    if (remaining <= 0) return [];

    // Determine interval based on projection type
    const intervalMs = {
      daily: 24 * 60 * 60 * 1000, // 1 day
      weekly: 7 * 24 * 60 * 60 * 1000, // 1 week
      monthly: 30 * 24 * 60 * 60 * 1000, // 30 days
    }[projection];

    const points = Math.min(50, Math.ceil(remaining / intervalMs));
    const dataPoints = [];

    for (let i = 0; i <= points; i++) {
      const timeOffset = i * intervalMs;
      const currentTime = now.getTime() + timeOffset;
      const timeFromNow = timeOffset; // Time from now, not from start
      const totalTimeFromStart = elapsed + timeOffset;

      // Standard unlocking (linear from start)
      const standardUnlocked = Math.min(
        totalAmount,
        streamed + (ratePerSecond * totalTimeFromStart / 1000)
      );

      // For yield calculation, yield is earned on the amount that has been unlocked/available
      // The yield accumulates over the projection period
      const daysFromNow = timeFromNow / (24 * 60 * 60 * 1000);
      const yieldEarned = calculateSimpleYield(standardUnlocked, apy, daysFromNow);
      const yieldEnhancedUnlocked = Math.min(totalAmount, standardUnlocked + yieldEarned);

      dataPoints.push({
        time: currentTime,
        timeLabel: formatTimeLabel(currentTime, projection),
        standard: standardUnlocked,
        yieldEnhanced: yieldEnhancedUnlocked,
        extra: yieldEarned,
      });
    }

    return dataPoints;
  }, [totalAmount, streamed, ratePerSecond, startTime, endTime, apy, projection]);

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-white/50">
        Stream has ended
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Projection Toggle */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          {(["daily", "weekly", "monthly"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setProjection(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                projection === type
                  ? "bg-[#00f5ff]/20 text-[#00f5ff] border border-[#00f5ff]/30"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="standardGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#666" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#666" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00f5ff" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="timeLabel"
              stroke="#00f5ff"
              strokeWidth={1}
              style={{ filter: "drop-shadow(0 0 4px rgba(0, 245, 255, 0.6))" }}
              tick={{ fill: "#00f5ff", fontSize: 12 }}
              axisLine={{ strokeWidth: 1 }}
              tickLine={false}
            />

            <YAxis
              stroke="#00f5ff"
              strokeWidth={1}
              style={{ filter: "drop-shadow(0 0 4px rgba(0, 245, 255, 0.6))" }}
              tick={{ fill: "#00f5ff", fontSize: 12 }}
              axisLine={{ strokeWidth: 1 }}
              tickLine={false}
              tickFormatter={(value) => formatAmount(value)}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                border: "1px solid rgba(0, 245, 255, 0.3)",
                borderRadius: "8px",
                color: "#00f5ff"
              }}
              formatter={(value: any, name: string | undefined) => {
                const numValue = typeof value === 'number' ? value : 0;
                if (name === "Standard Unlocking") {
                  return [formatAmount(numValue), name];
                } else if (name === "Yield-Enhanced Unlocking") {
                  return [formatAmount(numValue), name];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />

            <Legend
              wrapperStyle={{ color: "#00f5ff" }}
            />

            <Line
              type="monotone"
              dataKey="standard"
              stroke="#666"
              strokeWidth={2}
              name="Standard Unlocking"
              dot={false}
              strokeDasharray="5 5"
            />

            <Line
              type="monotone"
              dataKey="yieldEnhanced"
              stroke="#00f5ff"
              strokeWidth={3}
              name="Yield-Enhanced Unlocking"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 text-center">
        <p className="text-white/60 text-sm">
          Extra earnings from {apy * 100}% APY yield
        </p>
        <p className="text-[#00f5ff] text-lg font-semibold">
          +{formatAmount(data[data.length - 1]?.extra || 0)} {token}
        </p>
      </div>
    </div>
  );
}

function formatTimeLabel(timestamp: number, projection: ProjectionType): string {
  const date = new Date(timestamp);

  switch (projection) {
    case "daily":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "weekly":
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    case "monthly":
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
    default:
      return date.toLocaleDateString();
  }
}

function formatAmount(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(2);
}
