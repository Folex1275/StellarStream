"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Globe, Coins, ExternalLink, Loader2, Star } from "lucide-react";
import { useAssetProfile } from "@/lib/use-asset-profile";

interface AssetProfileModalProps {
  assetCode: string | null;
  onClose: () => void;
}

export function AssetProfileModal({ assetCode, onClose }: AssetProfileModalProps) {
  const { profile, isLoading } = useAssetProfile(assetCode);
  const isOpen = !!assetCode;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="backdrop" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

          <motion.div key="panel"
            initial={{ x:"100%", opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:"100%", opacity:0 }}
            transition={{ type:"spring", stiffness:320, damping:32 }}
            className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-sm border-l border-white/10 bg-[#0a0a0f]/95 backdrop-blur-2xl flex flex-col"
            role="dialog" aria-modal="true" aria-label={`${assetCode} asset profile`}>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <p className="font-heading text-base font-semibold text-white">Asset Profile</p>
              <button onClick={onClose} aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-white/30" /></div>
              ) : profile ? (
                <>
                  {/* Asset identity */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#00f5ff]/20 bg-[#00f5ff]/10 text-2xl font-bold text-[#00f5ff]">
                      {profile.code.slice(0,2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-xl font-bold text-white">{profile.code}</p>
                        {profile.verified && (
                          <span className="flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                      {profile.rating && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: profile.rating }).map((_,i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="font-body text-xs text-white/30 ml-1">Institutional Grade</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    {[
                      { icon: Globe, label: "Home Domain", value: profile.homeDomain ?? "Not set" },
                      { icon: Coins, label: "Total Supply", value: profile.totalSupply },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="glass-card px-4 py-3 flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0 text-white/30" />
                        <div>
                          <p className="font-body text-[10px] uppercase tracking-widest text-white/30">{label}</p>
                          <p className="font-ticker text-sm text-white mt-0.5">{value}</p>
                        </div>
                      </div>
                    ))}

                    <div className="glass-card px-4 py-3">
                      <p className="font-body text-[10px] uppercase tracking-widest text-white/30 mb-1">Issuer</p>
                      <p className="font-ticker text-xs text-white/60 break-all">{profile.issuer}</p>
                    </div>
                  </div>

                  <a href={`https://stellar.expert/explorer/public/asset/${profile.code}-${profile.issuer}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#00f5ff]/70 hover:text-[#00f5ff] transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View on Stellar.Expert
                  </a>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
