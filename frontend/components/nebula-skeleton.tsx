"use client";

interface NebulaSkeletonProps {
  variant?: "card" | "bento-small" | "bento-large" | "list-item";
  className?: string;
}

export default function NebulaSkeleton({
  variant = "card",
  className = "",
}: NebulaSkeletonProps) {
  const dimensions: Record<
    NonNullable<NebulaSkeletonProps["variant"]>,
    { width: string; height: string; minHeight?: string }
  > = {
    card: { width: "380px", height: "auto", minHeight: "400px" },
    "bento-small": { width: "360px", height: "200px" },
    "bento-large": { width: "100%", height: "320px" },
    "list-item": { width: "100%", height: "80px" },
  };

  const { width, height, minHeight } = dimensions[variant];

  return (
    <>
      <style>{`
        @keyframes nebula-sweep {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes nebula-pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes shimmer-glow {
          0%, 100% {
            box-shadow: 
              0 0 0 1px rgba(0, 229, 255, 0.05),
              0 8px 40px rgba(0, 0, 0, 0.6),
              0 0 60px rgba(0, 229, 255, 0.04) inset;
          }
          50% {
            box-shadow: 
              0 0 0 1px rgba(0, 229, 255, 0.12),
              0 8px 40px rgba(0, 0, 0, 0.6),
              0 0 80px rgba(138, 43, 226, 0.08) inset;
          }
        }

        .nebula-skeleton {
          position: relative;
          background: rgba(10, 10, 20, 0.92);
          border: 1px solid rgba(0, 229, 255, 0.15);
          border-radius: 24px;
          overflow: hidden;
          animation: shimmer-glow 3s ease-in-out infinite;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .nebula-skeleton {
            background: rgba(10, 10, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .nebula-skeleton::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(
              110deg,
              transparent 0%,
              transparent 35%,
              rgba(0, 229, 255, 0.15) 45%,
              rgba(138, 43, 226, 0.2) 50%,
              rgba(0, 229, 255, 0.15) 55%,
              transparent 65%,
              transparent 100%
            );
          background-size: 200% 100%;
          animation: nebula-sweep 3s ease-in-out infinite;
          filter: blur(20px);
          pointer-events: none;
        }

        .nebula-skeleton::after {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 20% 30%, rgba(0, 229, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(138, 43, 226, 0.12) 0%, transparent 50%);
          animation: nebula-pulse 4s ease-in-out infinite;
          pointer-events: none;
          border-radius: 24px;
        }

        .skeleton-content {
          position: relative;
          z-index: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skeleton-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .skeleton-bar {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }

        .skeleton-bar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(0, 229, 255, 0.1) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: nebula-sweep 2s ease-in-out infinite;
        }

        .skeleton-circle {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 50%;
          position: relative;
          overflow: hidden;
        }

        .skeleton-circle::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            rgba(0, 229, 255, 0.15) 0%,
            transparent 70%
          );
          animation: nebula-pulse 2s ease-in-out infinite;
        }

        .skeleton-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .skeleton-block {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 14px 16px;
          position: relative;
          overflow: hidden;
        }

        .skeleton-block::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(138, 43, 226, 0.08) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: nebula-sweep 2.5s ease-in-out infinite;
        }
      `}</style>

      <div
        className={`nebula-skeleton ${className}`}
        style={{
          width,
          height,
          minHeight,
        }}
        role="status"
        aria-label="Loading content"
      >
        <div className="skeleton-content">
          {/* Header with title and badge */}
          <div className="skeleton-header">
            <div className="skeleton-bar" style={{ width: "120px", height: "20px" }} />
            <div className="skeleton-bar" style={{ width: "60px", height: "24px", borderRadius: "12px" }} />
          </div>

          {/* Avatar row for card variant */}
          {variant === "card" && (
            <div className="skeleton-row">
              <div className="skeleton-circle" style={{ width: "38px", height: "38px", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div className="skeleton-bar" style={{ width: "40px", height: "10px" }} />
                <div className="skeleton-bar" style={{ width: "100px", height: "12px" }} />
              </div>
              <div className="skeleton-bar" style={{ width: "40px", height: "2px" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                <div className="skeleton-bar" style={{ width: "40px", height: "10px" }} />
                <div className="skeleton-bar" style={{ width: "100px", height: "12px" }} />
              </div>
              <div className="skeleton-circle" style={{ width: "38px", height: "38px", flexShrink: 0 }} />
            </div>
          )}

          {/* Content block */}
          <div className="skeleton-block">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton-bar" style={{ width: "100px", height: "12px" }} />
                <div className="skeleton-bar" style={{ width: "80px", height: "18px" }} />
              </div>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton-bar" style={{ width: "60px", height: "12px" }} />
                <div className="skeleton-bar" style={{ width: "100px", height: "14px" }} />
              </div>
            </div>
          </div>

          {/* Progress section for card variant */}
          {variant === "card" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton-bar" style={{ width: "90px", height: "10px" }} />
                <div className="skeleton-bar" style={{ width: "50px", height: "10px" }} />
              </div>
              <div className="skeleton-bar" style={{ width: "100%", height: "4px", borderRadius: "999px" }} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div className="skeleton-bar" style={{ width: "80px", height: "10px" }} />
              </div>
            </div>
          )}

          {/* Button for card variant */}
          {variant === "card" && (
            <div className="skeleton-bar" style={{ width: "100%", height: "42px", borderRadius: "12px", marginTop: "4px" }} />
          )}

          {/* Bento content */}
          {(variant === "bento-small" || variant === "bento-large") && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                <div className="skeleton-bar" style={{ width: "60%", height: "16px" }} />
                <div className="skeleton-bar" style={{ width: "80%", height: "12px" }} />
              </div>
              {variant === "bento-large" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                  <div className="skeleton-bar" style={{ width: "100%", height: "14px" }} />
                  <div className="skeleton-bar" style={{ width: "90%", height: "14px" }} />
                  <div className="skeleton-bar" style={{ width: "70%", height: "14px" }} />
                </div>
              )}
            </>
          )}

          {/* List item content */}
          {variant === "list-item" && (
            <div className="skeleton-row" style={{ height: "100%", alignItems: "center" }}>
              <div className="skeleton-circle" style={{ width: "48px", height: "48px" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="skeleton-bar" style={{ width: "70%", height: "14px" }} />
                <div className="skeleton-bar" style={{ width: "50%", height: "12px" }} />
              </div>
              <div className="skeleton-bar" style={{ width: "80px", height: "32px", borderRadius: "8px" }} />
            </div>
          )}
        </div>

        <span className="sr-only">Loading...</span>
      </div>
    </>
  );
}
