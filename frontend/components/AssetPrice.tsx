"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssetPrice } from "@/lib/use-asset-price";

interface AssetPriceProps {
  amount: number;
  assetCode: string;
  className?: string;
  showToggle?: boolean;
}

/**
 * AssetPrice component
 * Displays real-time USD value of an asset with a pulse animation on update.
 */
export function AssetPrice({
  amount,
  assetCode,
  className = "",
  showToggle = true,
}: AssetPriceProps) {
  const [view, setView] = useState<"native" | "usd">("usd");
  const { price, justUpdated, isLoading } = useAssetPrice(assetCode);

  const usdValue = price !== null ? amount * price : null;

  const toggleView = () => {
    if (showToggle) {
      setView((v) => (v === "native" ? "usd" : "native"));
    }
  };

  return (
    <div
      className={`relative inline-flex flex-col items-start gap-1 ${className}`}
      onClick={toggleView}
      style={{ cursor: showToggle ? "pointer" : "default" }}
    >
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex items-baseline gap-1.5"
          >
            {view === "usd" ? (
              <>
                <span className="text-sm font-medium text-slate-400">$</span>
                <span className="text-lg font-bold text-white">
                  {usdValue !== null ? usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                </span>
                <span className="text-xs font-medium text-slate-500 uppercase">USD</span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-white">
                  {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}
                </span>
                <span className="text-sm font-medium text-slate-400 uppercase">{assetCode}</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pulse Indicator */}
        <AnimatePresence>
          {justUpdated && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: 1 }}
              className="absolute -right-4 top-1 w-2 h-2 rounded-full bg-cyan-400"
            />
          )}
        </AnimatePresence>
      </div>

      {isLoading && view === "usd" && (
        <span className="text-[10px] text-cyan-400/50 animate-pulse">Syncing Oracle...</span>
      )}
      
      {!isLoading && justUpdated && view === "usd" && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-[10px] text-cyan-400 font-medium"
        >
          Price Updated
        </motion.span>
      )}
    </div>
  );
}
