"use client";

import { useState } from "react";
import { StreamCurveVisualizer, StreamCurveSparkline } from "@/components/dashboard/StreamCurveVisualizer";
import { TrendingUp, Activity } from "lucide-react";

export default function CreateStreamDemoPage() {
  const [curveType, setCurveType] = useState<"linear" | "exponential">("linear");
  const [totalAmount, setTotalAmount] = useState(100000);
  const [duration, setDuration] = useState(30);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-3xl md:text-4xl text-white mb-2">
          Create Stream
        </h1>
        <p className="font-body text-sm md:text-base text-white/60">
          Configure your payment stream with visual curve preview
        </p>
      </div>

      {/* Main Form Card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form Inputs */}
          <div className="space-y-6">
            <h2 className="font-heading text-xl text-white mb-4">Stream Configuration</h2>

            {/* Amount Input */}
            <div>
              <label className="block font-body text-sm text-white/70 mb-2">
                Total Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-heading text-lg text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="100000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body text-sm text-white/40">
                  USDC
                </span>
              </div>
            </div>

            {/* Duration Input */}
            <div>
              <label className="block font-body text-sm text-white/70 mb-2">
                Duration (days)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 font-heading text-lg text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                placeholder="30"
              />
            </div>

            {/* Curve Type Selection */}
            <div>
              <label className="block font-body text-sm text-white/70 mb-3">
                Release Curve
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Linear Option */}
                <button
                  onClick={() => setCurveType("linear")}
                  className={`relative rounded-xl border p-4 transition-all ${
                    curveType === "linear"
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className={`h-4 w-4 ${curveType === "linear" ? "text-cyan-400" : "text-white/40"}`} />
                    <span className={`font-heading text-sm ${curveType === "linear" ? "text-white" : "text-white/70"}`}>
                      Linear
                    </span>
                  </div>
                  <StreamCurveSparkline curveType="linear" width={100} height={30} />
                  <p className="font-body text-xs text-white/40 mt-2">
                    Constant rate
                  </p>
                  {curveType === "linear" && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  )}
                </button>

                {/* Exponential Option */}
                <button
                  onClick={() => setCurveType("exponential")}
                  className={`relative rounded-xl border p-4 transition-all ${
                    curveType === "exponential"
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className={`h-4 w-4 ${curveType === "exponential" ? "text-violet-400" : "text-white/40"}`} />
                    <span className={`font-heading text-sm ${curveType === "exponential" ? "text-white" : "text-white/70"}`}>
                      Exponential
                    </span>
                  </div>
                  <StreamCurveSparkline curveType="exponential" width={100} height={30} />
                  <p className="font-body text-xs text-white/40 mt-2">
                    Accelerating
                  </p>
                  {curveType === "exponential" && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                  )}
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
              <p className="font-body text-xs text-cyan-400/80">
                {curveType === "linear" ? (
                  <>
                    <strong>Linear streams</strong> release funds at a constant rate. 
                    Perfect for salaries and regular payments.
                  </>
                ) : (
                  <>
                    <strong>Exponential streams</strong> start slow and accelerate over time. 
                    Ideal for vesting schedules and milestone-based releases.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right: Visualizer */}
          <div className="space-y-4">
            <h2 className="font-heading text-xl text-white mb-4">Release Preview</h2>
            
            <div className="rounded-xl border border-white/10 bg-black/40 p-6">
              <StreamCurveVisualizer
                curveType={curveType}
                totalAmount={totalAmount}
                duration={duration}
                width={400}
                height={240}
                showGrid={true}
                animated={true}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <p className="font-body text-xs text-white/40 mb-1">Rate (per day)</p>
                <p className="font-heading text-lg text-white tabular-nums">
                  {curveType === "linear" 
                    ? (totalAmount / duration).toLocaleString("en-US", { maximumFractionDigits: 0 })
                    : "Variable"
                  }
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <p className="font-body text-xs text-white/40 mb-1">At 50% time</p>
                <p className="font-heading text-lg text-white tabular-nums">
                  {curveType === "linear"
                    ? (totalAmount * 0.5).toLocaleString("en-US", { maximumFractionDigits: 0 })
                    : (totalAmount * 0.38).toLocaleString("en-US", { maximumFractionDigits: 0 })
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
          <button className="rounded-lg border border-white/10 bg-white/[0.02] px-6 py-3 font-semibold text-white/70 transition hover:bg-white/[0.05]">
            Cancel
          </button>
          <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:shadow-xl hover:shadow-cyan-500/40">
            Create Stream
          </button>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8">
        <h2 className="font-heading text-xl text-white mb-6">Curve Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-heading text-sm text-white/70 mb-3">Linear Release</h3>
            <StreamCurveVisualizer
              curveType="linear"
              totalAmount={totalAmount}
              duration={duration}
              width={350}
              height={180}
              showGrid={false}
              animated={false}
            />
          </div>
          <div>
            <h3 className="font-heading text-sm text-white/70 mb-3">Exponential Release</h3>
            <StreamCurveVisualizer
              curveType="exponential"
              totalAmount={totalAmount}
              duration={duration}
              width={350}
              height={180}
              showGrid={false}
              animated={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
