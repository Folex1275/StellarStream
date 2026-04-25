"use client";

import React from "react";
import { SplitProvider, useSplit } from "@/features/splitter/SplitProvider";
import { 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  CreditCard,
  CheckCircle2,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePriceSlippage } from "@/lib/use-price-slippage";
import { PriceSlippageWarning } from "@/components/price-slippage-warning";

// Asset used for volatile-price tracking in this splitter.
// XLM is the only volatile asset currently supported in the V3 splitter.
const VOLATILE_ASSET = "XLM";

function SplitWizard() {
  const { 
    recipients, 
    step, 
    addRecipient, 
    removeRecipient, 
    nextStep, 
    prevStep 
  } = useSplit();

  const {
    priceAtStart,
    priceNow,
    delta,
    slippageExceeded,
    acknowledgeRefresh,
  } = usePriceSlippage(VOLATILE_ASSET);

  // Step 1: Add Recipients
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-white">Add Recipients</h3>
        <button 
          onClick={() => addRecipient({ address: "", amount: "0", share: 0 })}
          className="flex items-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Recipient
        </button>
      </div>

      <div className="space-y-3">
        {recipients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-white/10" />
            <p className="font-body text-sm text-white/40">No recipients added yet.</p>
          </div>
        ) : (
          recipients.map((r, i) => (
            <motion.div 
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <span className="font-body text-xs text-white/20 w-4 font-mono">{i + 1}</span>
              <input 
                type="text" 
                placeholder="G...Address"
                className="flex-1 bg-transparent border-none focus:ring-0 text-white font-mono text-sm placeholder:text-white/20"
                value={r.address}
                readOnly
              />
              <button 
                onClick={() => removeRecipient(r.id)}
                className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                aria-label="Remove recipient"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={nextStep}
          disabled={recipients.length === 0}
          className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-30 transition-all"
        >
          Next: Allocation
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-between px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
              step >= s ? "border-cyan-400 bg-cyan-400 text-black shadow-[0_0_12px_#22d3ee88]" : "border-white/10 text-white/20"
            }`}>
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-bold">{s}</span>}
            </div>
            <span className={`hidden sm:block text-xs font-bold uppercase tracking-widest ${
              step >= s ? "text-white" : "text-white/20"
            }`}>
              {s === 1 ? "Recipients" : s === 2 ? "Allocation" : "Confirm"}
            </span>
            {s < 3 && <div className={`h-0.5 w-12 rounded-full ${step > s ? "bg-cyan-400" : "bg-white/5"}`} />}
          </div>
        ))}
      </div>

      {/* Wizard Content */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-3xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderStep1()}
            </motion.div>
          )}
          {step > 1 && (
             <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
             >
                <div className="py-12 text-center space-y-4">
                  <Activity className="h-12 w-12 text-cyan-400 mx-auto animate-pulse" />
                  <p className="font-body text-white/50">Step {step} implementation in progress...</p>

                  {/* Slippage warning shown at confirmation step */}
                  {step === 3 && slippageExceeded && priceAtStart !== null && priceNow !== null && delta !== null && (
                    <div className="text-left">
                      <PriceSlippageWarning
                        assetCode={VOLATILE_ASSET}
                        delta={delta}
                        priceAtStart={priceAtStart}
                        priceNow={priceNow}
                        onRefresh={acknowledgeRefresh}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3">
                    <button onClick={prevStep} className="text-xs font-bold text-cyan-400 underline uppercase tracking-widest">Go Back</button>
                    {step === 3 && (
                      <button
                        disabled={slippageExceeded}
                        className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30 transition-all"
                        title={slippageExceeded ? "Refresh the price before confirming" : undefined}
                      >
                        Confirm Split
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SplitPage() {
  return (
    <div className="flex-1 p-8 pt-6">
      <div className="mb-8">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-white mb-2">V3 Splitter</h2>
        <p className="font-body text-sm text-white/50">Configure your multi-recipient distribution in three simple steps.</p>
      </div>

      <SplitProvider>
        <SplitWizard />
      </SplitProvider>
    </div>
  );
}
