/**
 * Bento Grid Dashboard Component
 * Issue #522: Modular Bento-Grid Dashboard (Desktop/Mobile)
 * 
 * Features:
 * - 4-column desktop layout → single-column mobile (Pixel 7)
 * - Ghost Glass effect for empty state tiles
 * - Responsive Auto-Layout grid system
 */

"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ============================================================================
// BENTO GRID CONTEXT & TYPES
// ============================================================================

export interface BentoTileProps {
  children?: React.ReactNode;
  className?: string;
  span?: "1x1" | "2x1" | "1x2" | "2x2" | "full";
  hover?: boolean;
  animate?: boolean;
}

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "compact" | "spacious";
}

// ============================================================================
// BENTO GRID LAYOUT SYSTEM
// ============================================================================

/**
 * BentoGrid - Main grid container with responsive breakpoints
 * 
 * Grid System:
 * - Mobile (Pixel 7, <640px): 1 column, 8px gap
 * - Tablet (640-1024px): 2 columns, 12px gap
 * - Desktop (1024-1440px): 3 columns, 16px gap
 * - Large Desktop (>1440px): 4 columns, 20px gap
 */
export function BentoGrid({ children, className, variant = "default" }: BentoGridProps) {
  const gapSizes = {
    compact: { mobile: "8px", tablet: "10px", desktop: "12px" },
    default: { mobile: "12px", tablet: "16px", desktop: "20px" },
    spacious: { mobile: "16px", tablet: "20px", desktop: "24px" },
  };

  const gaps = gapSizes[variant];

  return (
    <div
      className={cn(
        "grid w-full",
        // Responsive column configuration using Tailwind arbitrary values
        "grid-cols-1", // Mobile: 1 column (Pixel 7 default)
        "sm:grid-cols-2", // Tablet: 2 columns
        "lg:grid-cols-3", // Desktop: 3 columns
        "xl:grid-cols-4", // Large Desktop: 4 columns
        className
      )}
      style={{
        gap: `clamp(${gaps.mobile}, 2vw, ${gaps.desktop})`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// BENTO TILE COMPONENT
// ============================================================================

/**
 * BentoTile - Individual tile with span support
 * 
 * Span Configurations:
 * - 1x1: Default single cell
 * - 2x1: Double width (desktop spans 2 columns)
 * - 1x2: Double height (spans 2 rows via aspect ratio)
 * - 2x2: Large feature tile (spans 2x2 cells)
 * - full: Full width (all columns)
 */
export function BentoTile({
  children,
  className,
  span = "1x1",
  hover = false,
  animate = false,
}: BentoTileProps) {
  const spanClasses = {
    "1x1": "",
    "2x1": "col-span-1 sm:col-span-2",
    "1x2": "row-span-1 sm:row-span-2 aspect-square sm:aspect-auto",
    "2x2": "col-span-1 sm:col-span-2 row-span-1 sm:row-span-2",
    "full": "col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4",
  };

  const content = (
    <div
      className={cn(
        // Base tile styling
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-white/[0.06] to-white/[0.02]",
        "border border-white/[0.08]",
        "transition-all duration-300 ease-out",
        // Span configuration
        spanClasses[span],
        // Hover state
        hover && "hover:border-white/[0.15] hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/[0.02] pointer-events-none" />
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// ============================================================================
// GHOST GLASS EMPTY STATE TILE
// ============================================================================

/**
 * GhostGlassTile - Empty state tile with ethereal ghost effect
 * 
 * Visual Features:
 * - Frosted glass appearance with backdrop blur
 * - Animated shimmer/dashed border animation
 * - Pulsing ghost icon placeholder
 * - Hover reveals subtle grid pattern
 */
export function GhostGlassTile({
  title = "No data yet",
  subtitle = "Content will appear here",
  icon,
  className,
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Ghost Glass Base
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-white/[0.03] to-transparent",
        "border border-dashed border-white/[0.12]",
        // Backdrop blur for glass effect
        "backdrop-blur-xl backdrop-saturate-150",
        // Animated border glow
        "after:absolute after:inset-0 after:rounded-2xl",
        "after:bg-gradient-to-br after:from-primary/10 after:to-secondary/10",
        "after:opacity-0 after:transition-opacity after:duration-500",
        "hover:after:opacity-100",
        className
      )}
    >
      {/* Shimmer animation layer */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
      </div>

      {/* Grid dot pattern (visible on hover) */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-500"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center">
        {/* Ghost Icon Placeholder */}
        <div className="relative mb-4">
          {icon ? (
            <div className="text-white/30">{icon}</div>
          ) : (
            <div className="relative">
              {/* Pulsing ghost orb */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-white/50 mb-1">{title}</p>

        {/* Subtitle */}
        <p className="text-xs text-white/30">{subtitle}</p>
      </div>
    </div>
  );
}

// ============================================================================
// BENTO DASHBOARD LAYOUT TEMPLATE
// ============================================================================

/**
 * BentoDashboard - Pre-configured dashboard layout template
 * 
 * Layout Structure (4-column desktop):
 * ┌─────────┬─────────┬─────────┬─────────┐
 * │  Nav/   │  Stats  │  Stats  │  Quick  │
 * │  Logo   │  Card   │  Card   │  Action │
 * ├─────────┴─────────┼─────────┴─────────┤
 * │     Chart/        │     Activity/     │
 * │     Graph Area    │     Feed Area     │
 * ├───────────────────┼───────────────────┤
 * │   Recent/         │   Empty/Ghost     │
 * │   Streams         │   State Tile      │
 * └───────────────────┴───────────────────┘
 */
export function BentoDashboard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 md:p-6 lg:p-8", className)}>
      {/* Header Row */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Welcome to your StellarStream workspace
        </p>
      </div>

      <BentoGrid variant="default">
        {/* Navigation/Logo Area - 2x1 span */}
        <BentoTile span="2x1" hover animate>
          <div className="p-6 h-full flex items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading font-semibold text-lg">StellarStream</h2>
                <p className="text-xs text-white/40">v2.0 Protocol</p>
              </div>
            </div>
          </div>
        </BentoTile>

        {/* Stats Card 1 */}
        <BentoTile span="1x1" hover animate>
          <div className="p-6 h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Total Streams</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-heading font-bold">24</p>
            <p className="text-xs text-white/40 mt-1">Active: 18</p>
          </div>
        </BentoTile>

        {/* Stats Card 2 */}
        <BentoTile span="1x1" hover animate>
          <div className="p-6 h-full">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Volume (XLM)</span>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-heading font-bold">1,247.5</p>
            <p className="text-xs text-green-400/80 mt-1">↑ 12.3% this month</p>
          </div>
        </BentoTile>

        {/* Quick Action Tile */}
        <BentoTile span="1x1" hover animate>
          <div className="p-6 h-full flex flex-col justify-between">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Quick Create</span>
            <button className="mt-4 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-black font-semibold text-sm hover:opacity-90 transition-opacity">
              + New Stream
            </button>
          </div>
        </BentoTile>

        {/* Chart Area - 2x2 span */}
        <BentoTile span="2x2" hover animate>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Flow Analytics</span>
              <div className="flex gap-2">
                {["1D", "1W", "1M", "ALL"].map((period) => (
                  <button
                    key={period}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-colors",
                      period === "1W"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            {/* Placeholder Chart Area */}
            <div className="flex-1 relative min-h-[200px]">
              <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary/40 to-primary/20 rounded-t-sm"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] to-transparent opacity-50 pointer-events-none" />
            </div>
          </div>
        </BentoTile>

        {/* Activity Feed - 1x2 span */}
        <BentoTile span="1x2" hover animate>
          <div className="p-6 h-full">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider block mb-4">Recent Activity</span>
            <div className="space-y-3">
              {[
                { action: "Stream created", address: "GDQ...", time: "2m ago" },
                { action: "Withdrawal", address: "GA7...", time: "15m ago" },
                { action: "Stream paused", address: "GBX...", time: "1h ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                  <div>
                    <p className="text-sm text-white/80">{item.action}</p>
                    <p className="text-xs text-white/40 font-ticker">{item.address}...</p>
                  </div>
                  <span className="text-xs text-white/30">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </BentoTile>

        {/* Empty State - Ghost Glass Tile */}
        <BentoTile span="2x1">
          <GhostGlassTile
            title="Pending Approvals"
            subtitle="No items awaiting your approval"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </BentoTile>

        {/* Ghost State for Mobile */}
        <BentoTile span="1x1">
          <GhostGlassTile
            title="Gas Tank"
            subtitle="Configure your gas reserves"
          />
        </BentoTile>
      </BentoGrid>
    </div>
  );
}

// ============================================================================
// RESPONSIVE BREAKPOINT UTILITIES
// ============================================================================

/**
 * GridBreakpoints - Enum for responsive grid breakpoints
 */
export const GridBreakpoints = {
  MOBILE: 640,   // Pixel 7 width
  TABLET: 768,
  DESKTOP: 1024,
  LARGE: 1280,
  WIDE: 1536,
} as const;

/**
 * GridSpanConfig - Configuration for tile spans at different breakpoints
 */
export const GridSpanConfig = {
  MOBILE: { cols: 1, rows: 1 },
  TABLET: { cols: 2, rows: 1 },
  DESKTOP: { cols: 3, rows: 1 },
  LARGE: { cols: 4, rows: 1 },
} as const;

// ============================================================================
// CSS ANIMATIONS (Add to globals.css or tailwind config)
// ============================================================================

/*
Add to tailwind.config.ts or extend in globals.css:

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 3s ease-in-out infinite;
}
*/

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import { BentoGrid, BentoTile, GhostGlassTile, BentoDashboard } from "@/components/bento/bento-grid-dashboard";

// Option 1: Use pre-built dashboard template
<BentoDashboard />

// Option 2: Build custom layout
<BentoGrid variant="spacious">
  <BentoTile span="2x1" hover animate>
    <YourContent />
  </BentoTile>
  <BentoTile span="1x1">
    <GhostGlassTile 
      title="No Data" 
      subtitle="Add your first item" 
    />
  </BentoTile>
</BentoGrid>
*/
