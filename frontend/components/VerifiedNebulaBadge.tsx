"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

/**
 * VerifiedNebulaBadge
 * A branding component for streams verified on the Nebula V2 contract.
 */
export function VerifiedNebulaBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
    >
      <ShieldCheck className="h-4 w-4 text-cyan-400" />
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">
          Verified on
        </span>
        <span className="text-[12px] font-black uppercase tracking-tighter text-cyan-400">
          Nebula <span className="text-white/50">V2</span>
        </span>
      </div>
    </motion.div>
  );
}
