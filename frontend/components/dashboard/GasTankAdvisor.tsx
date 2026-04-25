"use client";

import React from "react";
import { useGasAdvisor } from "@/lib/use-gas-advisor";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  TrendingDown, 
  Target, 
  AlertCircle, 
  PlusCircle, 
  Clock, 
  ArrowRight,
  ChevronRight,
  Activity,
} from "lucide-react";

interface GasTankAdvisorProps {
  currentBalanceXlm: number;
  onApplySuggestion: (amount: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function GasTankAdvisor({ 
  currentBalanceXlm, 
  onApplySuggestion,
  isOpen,
  onClose
}: GasTankAdvisorProps) {
  const { suggestion, loading, error } = useGasAdvisor(currentBalanceXlm);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Advisor Panel */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gray-950/40 p-1 shadow-2xl backdrop-blur-2xl"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 blur-[80px]" />

        <div className="relative p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-white">Gas-Tank Advisor</h3>
                <p className="font-body text-xs text-white/50">Historical consumption analysis</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <PlusCircle className="h-5 w-5 rotate-45" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/10" />
                <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
              </div>
              <p className="font-body text-sm text-cyan-400/80">Analyzing your split history...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10 text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="font-body text-sm text-red-400/80">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white"
              >
                Close Advisor
              </button>
            </div>
          ) : suggestion && (
            <div className="space-y-6">
              {/* Main Insight */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-widest text-white/40 mb-1">Optimal 3-Month Buffer</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-4xl font-bold text-white">
                        {suggestion.suggestedBufferXlm.toFixed(1)}
                      </span>
                      <span className="font-body text-sm font-medium text-cyan-400">XLM</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-400/10 px-2 py-1 flex items-center gap-1 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-400/20">
                    <TrendingDown className="h-3 w-3" />
                    RELIABLE
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="font-body text-[9px] uppercase text-white/30">Burn / month</p>
                    <p className="font-body text-sm font-semibold text-white/80">{suggestion.disbursementsPerMonth.toFixed(1)} XLM</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-body text-[9px] uppercase text-white/30">Current Runway</p>
                    <p className={`font-body text-sm font-semibold ${suggestion.currentRunwayDays && suggestion.currentRunwayDays < 7 ? "text-amber-400" : "text-white/80"}`}>
                      {suggestion.currentRunwayDays?.toFixed(0) ?? "0"} Days
                    </p>
                  </div>
                </div>
              </div>

              {/* Stat breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-body text-[8px] uppercase text-white/30 tracking-wider">Avg Cost / Trans</p>
                    <p className="font-body text-xs font-bold text-white/70">{suggestion.averageCostXlm.toFixed(4)} XLM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-body text-[8px] uppercase text-white/30 tracking-wider">Activity level</p>
                    <p className="font-body text-xs font-bold text-white/70">{(suggestion.disbursementsPerMonth / 30).toFixed(1)} tx / day</p>
                  </div>
                </div>
              </div>

              {/* History Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-body text-xs font-semibold text-white/60">Sample consumption</h4>
                  <div className="flex items-center gap-1 text-[10px] text-white/30">
                    <Clock className="h-2.5 w-2.5" />
                    Last 10 events
                  </div>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {suggestion.history.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-lg bg-white/[0.01] px-3 py-2 text-[10px]">
                      <span className="text-white/40 font-body">Disbursement #{event.id.split('_')[1]}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">{event.resourceFeeXlm.toFixed(4)} XLM</span>
                        <ArrowRight className="h-2 w-2 text-white/20" />
                      </div>
                    </div>
                  ))}
                  <div className="text-center py-1 opacity-20">
                    <ChevronRight className="h-3 w-3 mx-auto rotate-90" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-heading text-xs font-bold text-white/60 hover:bg-white/10 transition-all"
                >
                  Later
                </button>
                <button 
                  onClick={() => {
                    onApplySuggestion(Math.ceil(suggestion.suggestedBufferXlm - currentBalanceXlm));
                    onClose();
                  }}
                  className="flex-[2] rounded-xl bg-cyan-400 py-3 font-heading text-xs font-bold text-black hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
                >
                  Apply Suggested Buffer
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
