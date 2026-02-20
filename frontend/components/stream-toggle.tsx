"use client";

import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useState } from "react";

interface StreamToggleProps {
  streamId: string;
  initialState?: boolean;
  onToggle?: (isPaused: boolean) => Promise<void>;
}

export function StreamToggle({
  streamId,
  initialState = false,
  onToggle,
}: StreamToggleProps) {
  const [isPaused, setIsPaused] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const newState = !isPaused;
    
    try {
      await onToggle?.(newState);
      setIsPaused(newState);
    } catch (error) {
      console.error("Failed to toggle stream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center gap-4">
      <motion.button
        onClick={handleToggle}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative h-16 w-32 rounded-full border-2 transition-all duration-300
          ${isPaused 
            ? "border-red-500/50 bg-red-500/10" 
            : "border-[#00F5FF]/50 bg-[#00F5FF]/10"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {/* Glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-300 ${
            isPaused ? "bg-red-500/30" : "bg-[#00F5FF]/30"
          }`}
          animate={{
            opacity: isPaused ? [0.3, 0.6, 0.3] : [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: isPaused ? 1.5 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Toggle knob */}
        <motion.div
          className={`absolute top-1 h-14 w-14 rounded-full border transition-colors duration-300 ${
            isPaused
              ? "border-red-400/60 bg-red-500/80"
              : "border-[#00F5FF]/60 bg-[#00F5FF]/80"
          }`}
          animate={{
            x: isPaused ? 4 : 68,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            {isPaused ? (
              <Play className="h-6 w-6 text-white" fill="white" />
            ) : (
              <Pause className="h-6 w-6 text-white" fill="white" />
            )}
          </div>
        </motion.div>

        {/* Flowing animation for active state */}
        {!isPaused && (
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F5FF]/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}
      </motion.button>

      {/* Status label */}
      <div className="flex flex-col">
        <span
          className={`text-sm font-semibold transition-colors duration-300 ${
            isPaused ? "text-red-400" : "text-[#00F5FF]"
          }`}
        >
          {isPaused ? "Paused" : "Flowing"}
        </span>
        <span className="text-xs text-white/50">Stream #{streamId}</span>
      </div>
    </div>
  );
}
