"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

interface AssetData {
  token: string;
  amount: number;
  usdValue: number;
  color: string;
}

interface AssetDistributionChartProps {
  assets: AssetData[];
  className?: string;
}

export default function AssetDistributionChart({
  assets,
  className = "",
}: AssetDistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Calculate total USD value
  const totalUsdValue = assets.reduce((sum, asset) => sum + asset.usdValue, 0);

  // Calculate percentages
  const chartData = assets.map((asset) => ({
    ...asset,
    percentage: (asset.usdValue / totalUsdValue) * 100,
  }));

  // Nebula gradient colors for each segment
  const nebulaGradients = [
    { id: "nebula-cyan", colors: ["#00f5ff", "#00d4e6"] },
    { id: "nebula-violet", colors: ["#8a00ff", "#b84dff"] },
    { id: "nebula-pink", colors: ["#ff3b5c", "#ff6b88"] },
    { id: "nebula-amber", colors: ["#ffb300", "#ffd54f"] },
    { id: "nebula-emerald", colors: ["#00e676", "#69f0ae"] },
  ];

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{
            filter: "drop-shadow(0 0 12px rgba(0, 245, 255, 0.6))",
            transition: "all 0.3s ease",
          }}
        />
      </g>
    );
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const activeAsset = activeIndex !== null ? chartData[activeIndex] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700&display=swap');

        .asset-distribution-container {
          position: relative;
          width: 100%;
          height: 100%;
          font-family: 'Syne', sans-serif;
        }

        .chart-center-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
          z-index: 10;
        }

        .center-label {
          font-size: 11px;
          color: rgba(232, 234, 246, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }

        .center-value {
          font-family: 'Space Mono', monospace;
          font-size: 28px;
          font-weight: 700;
          color: #00f5ff;
          text-shadow: 0 0 20px rgba(0, 245, 255, 0.4);
          transition: all 0.3s ease;
        }

        .center-token {
          font-size: 13px;
          color: rgba(232, 234, 246, 0.7);
          margin-top: 2px;
          font-weight: 600;
        }

        .legend-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(10, 10, 20, 0.80);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .legend-item {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }

        .legend-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .legend-item.active {
          background: rgba(0, 245, 255, 0.08);
          border-color: rgba(0, 245, 255, 0.3);
          box-shadow: 0 0 16px rgba(0, 245, 255, 0.2);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-text {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .legend-token {
          font-size: 13px;
          font-weight: 600;
          color: #e8eaf6;
        }

        .legend-percentage {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: rgba(232, 234, 246, 0.6);
        }

        @media (max-width: 640px) {
          .center-value {
            font-size: 22px;
          }

          .legend-container {
            gap: 8px;
          }

          .legend-item {
            padding: 6px 10px;
          }
        }
      `}</style>

      <div className={`asset-distribution-container ${className}`}>
        {/* SVG Gradients */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            {nebulaGradients.map((gradient) => (
              <linearGradient
                key={gradient.id}
                id={gradient.id}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor={gradient.colors[0]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor={gradient.colors[1]}
                  stopOpacity={0.6}
                />
              </linearGradient>
            ))}
          </defs>
        </svg>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={2}
              dataKey="usdValue"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              activeShape={renderActiveShape}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${nebulaGradients[index % nebulaGradients.length].id})`}
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(0, 245, 255, 0.3))",
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.5,
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="chart-center-text">
          <div className="center-label">
            {activeAsset ? activeAsset.token : "Total Value"}
          </div>
          <div className="center-value">
            {formatUSD(activeAsset ? activeAsset.usdValue : totalUsdValue)}
          </div>
          {activeAsset && (
            <div className="center-token">
              {activeAsset.percentage.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="legend-container">
          {chartData.map((asset, index) => (
            <div
              key={asset.token}
              className={`legend-item ${activeIndex === index ? "active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className="legend-color"
                style={{
                  background: `linear-gradient(135deg, ${nebulaGradients[index % nebulaGradients.length].colors[0]}, ${nebulaGradients[index % nebulaGradients.length].colors[1]})`,
                }}
              />
              <div className="legend-text">
                <span className="legend-token">{asset.token}</span>
                <span className="legend-percentage">
                  {asset.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
