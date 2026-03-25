"use client";

import { useMemo } from "react";

type CurveType = "linear" | "exponential";

interface StreamCurveVisualizerProps {
  curveType: CurveType;
  totalAmount?: number;
  duration?: number;
  width?: number;
  height?: number;
  showGrid?: boolean;
  animated?: boolean;
}

export function StreamCurveVisualizer({
  curveType,
  totalAmount = 100000,
  duration = 30,
  width = 400,
  height = 200,
  showGrid = true,
  animated = true,
}: StreamCurveVisualizerProps) {
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate curve points
  const points = useMemo(() => {
    const numPoints = 100;
    const result: { x: number; y: number; amount: number; time: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const progress = i / numPoints;
      const time = progress * duration;
      let amount: number;

      if (curveType === "linear") {
        amount = progress * totalAmount;
      } else {
        // Exponential curve: y = total * (e^(k*x) - 1) / (e^k - 1)
        // where k controls the steepness (using k=3 for visible curve)
        const k = 3;
        amount = totalAmount * (Math.exp(k * progress) - 1) / (Math.exp(k) - 1);
      }

      const x = (progress * chartWidth);
      const y = chartHeight - (amount / totalAmount) * chartHeight;

      result.push({ x, y, amount, time });
    }

    return result;
  }, [curveType, totalAmount, duration, chartWidth, chartHeight]);

  // Generate SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  // Area fill path
  const areaD = `${pathD} L${chartWidth},${chartHeight} L0,${chartHeight}Z`;

  // Grid lines
  const yGridLines = [0, 0.25, 0.5, 0.75, 1];
  const xGridLines = [0, 0.25, 0.5, 0.75, 1];

  // Format helpers
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  const formatTime = (time: number) => {
    if (time >= 30) return `${Math.floor(time / 30)}mo`;
    return `${Math.floor(time)}d`;
  };

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
      >
        <defs>
          {/* Gradient for line */}
          <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>

          {/* Gradient for area fill */}
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${padding.left},${padding.top})`}>
          {/* Grid lines */}
          {showGrid && (
            <>
              {/* Horizontal grid */}
              {yGridLines.map((ratio) => {
                const y = chartHeight * (1 - ratio);
                return (
                  <g key={`y-${ratio}`}>
                    <line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={1}
                    />
                    <text
                      x={-8}
                      y={y + 4}
                      textAnchor="end"
                      fill="rgba(255,255,255,0.4)"
                      fontSize={10}
                      fontFamily="monospace"
                    >
                      {formatAmount(totalAmount * ratio)}
                    </text>
                  </g>
                );
              })}

              {/* Vertical grid */}
              {xGridLines.map((ratio) => {
                const x = chartWidth * ratio;
                return (
                  <g key={`x-${ratio}`}>
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={chartHeight}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth={1}
                    />
                    <text
                      x={x}
                      y={chartHeight + 20}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.4)"
                      fontSize={10}
                      fontFamily="monospace"
                    >
                      {formatTime(duration * ratio)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Area fill */}
          <path
            d={areaD}
            fill="url(#areaGradient)"
            style={{
              transition: animated ? "d 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />

          {/* Curve line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            style={{
              transition: animated ? "d 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />

          {/* End point indicator */}
          <circle
            cx={chartWidth}
            cy={points[points.length - 1].y}
            r={5}
            fill="#a78bfa"
            filter="url(#glow)"
          >
            {animated && (
              <animate
                attributeName="r"
                values="5;7;5"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </circle>

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 35}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={11}
            fontFamily="sans-serif"
          >
            Time
          </text>
          <text
            x={-chartHeight / 2}
            y={-45}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={11}
            fontFamily="sans-serif"
            transform={`rotate(-90, -${chartHeight / 2}, -45)`}
          >
            Amount Unlocked
          </text>
        </g>
      </svg>

      {/* Curve type label */}
      <div className="absolute top-2 right-2 rounded-lg border border-white/10 bg-black/60 backdrop-blur-sm px-3 py-1.5">
        <p className="font-body text-xs text-white/70">
          <span className="font-semibold text-white capitalize">{curveType}</span> Curve
        </p>
      </div>
    </div>
  );
}

// Compact version for inline preview
export function StreamCurveSparkline({
  curveType,
  width = 120,
  height = 40,
}: {
  curveType: CurveType;
  width?: number;
  height?: number;
}) {
  const points = useMemo(() => {
    const numPoints = 50;
    const result: { x: number; y: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const progress = i / numPoints;
      let value: number;

      if (curveType === "linear") {
        value = progress;
      } else {
        const k = 3;
        value = (Math.exp(k * progress) - 1) / (Math.exp(k) - 1);
      }

      const x = (progress * width);
      const y = height - (value * height);

      result.push({ x, y });
    }

    return result;
  }, [curveType, width, height]);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`sparkGrad-${curveType}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke={`url(#sparkGrad-${curveType})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: "d 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </svg>
  );
}
