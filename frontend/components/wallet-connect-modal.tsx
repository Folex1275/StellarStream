"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, ExternalLink, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";

// Freighter wallet icon (SVG)
function FreighterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="16" fill="url(#freighter-gradient)" />
      <path
        d="M8 12h16v8H8v-8z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M10 14h4v4h-4v-4z"
        fill="#00f5ff"
      />
      <path
        d="M18 14h4v4h-4v-4z"
        fill="#00f5ff"
      />
      <defs>
        <linearGradient id="freighter-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#00f5ff" />
          <stop offset="1" stopColor="#00a8b5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// xBull wallet icon (SVG)
function XBullIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="16" fill="url(#xbull-gradient)" />
      <path
        d="M10 10l6 6-6 6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 10l6 6-6 6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="xbull-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#8a00ff" />
          <stop offset="1" stopColor="#5c00a3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Albedo wallet icon (SVG)
function AlbedoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="16" fill="url(#albedo-gradient)" />
      <path
        d="M9 22L16 10l7 12"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="18" r="2" fill="white" />
      <defs>
        <linearGradient id="albedo-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#00c389" />
          <stop offset="1" stopColor="#008f67" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Stellar logo icon
function StellarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="16" fill="url(#stellar-gradient)" />
      <path
        d="M8 16h16M16 8v16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4" fill="white" fillOpacity="0.3" />
      <defs>
        <linearGradient id="stellar-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#1a1a2e" />
          <stop offset="1" stopColor="#0f0f1a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface WalletTileProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: "cyan" | "violet" | "emerald";
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: "large" | "medium" | "small";
  className?: string;
}

function WalletTile({
  title,
  description,
  icon,
  accentColor,
  onClick,
  isLoading,
  disabled,
  size = "medium",
  className = "",
}: WalletTileProps) {
  const accentStyles = {
    cyan: {
      bg: "bg-cyan-500/10 hover:bg-cyan-500/20",
      border: "border-cyan-500/30 hover:border-cyan-500/50",
      glow: "hover:shadow-[0_0_30px_rgba(0,245,255,0.2)]",
      text: "text-cyan-400",
      iconBg: "bg-cyan-500/20",
    },
    violet: {
      bg: "bg-violet-500/10 hover:bg-violet-500/20",
      border: "border-violet-500/30 hover:border-violet-500/50",
      glow: "hover:shadow-[0_0_30px_rgba(138,0,255,0.2)]",
      text: "text-violet-400",
      iconBg: "bg-violet-500/20",
    },
    emerald: {
      bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
      border: "border-emerald-500/30 hover:border-emerald-500/50",
      glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]",
      text: "text-emerald-400",
      iconBg: "bg-emerald-500/20",
    },
  };

  const sizeStyles = {
    large: "col-span-2 row-span-2 min-h-[200px]",
    medium: "col-span-1 row-span-1 min-h-[140px]",
    small: "col-span-1 row-span-1 min-h-[100px]",
  };

  const styles = accentStyles[accentColor];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        relative flex flex-col items-center justify-center gap-3 p-6
        rounded-[24px] border backdrop-blur-xl
        transition-all duration-300 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${styles.bg} ${styles.border} ${styles.glow}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {/* Glass sheen effect */}
      <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[24px] bg-black/40 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {/* Icon */}
      <div className={`relative p-3 rounded-2xl ${styles.iconBg}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="relative text-center">
        <h3 className={`text-lg font-semibold ${styles.text}`}>{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>
    </motion.button>
  );
}

export function WalletConnectModal() {
  const {
    isModalOpen,
    closeModal,
    connectFreighter,
    connectXBull,
    connectAlbedo,
    isConnecting,
    error,
    isConnected,
    address,
    walletType,
    disconnect,
  } = useWallet();

  const formatAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const walletTypeLabel =
    walletType === "freighter" ? "Freighter" : walletType === "xbull" ? "xBull" : "Albedo";

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <AnimatePresence>
        {isModalOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6"
              >
                <div className="relative bg-[#0a0a14]/95 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-2xl">
                  {/* Close button */}
                  <Dialog.Close asChild>
                    <button
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </Dialog.Close>

                  {/* Header */}
                  <div className="text-center mb-6">
                    <Dialog.Title className="text-2xl font-bold text-white">
                      Connect Wallet
                    </Dialog.Title>
                    <Dialog.Description className="text-gray-400 mt-2">
                      Choose your preferred Stellar wallet to connect
                    </Dialog.Description>
                  </div>

                  {/* Error message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Connected state */}
                  {isConnected ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-green-500/20">
                            <Wallet className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Connected</p>
                            <p className="text-white font-medium">
                              {walletTypeLabel} • {formatAddress(address)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          disconnect();
                          closeModal();
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium transition-colors"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  ) : (
                    /* Bento Grid Layout */
                    <div className="grid grid-cols-2 gap-4">
                      {/* Tile 1: Connect Freighter (Large) */}
                      <WalletTile
                        title="Connect Freighter"
                        description="Stellar's most popular wallet"
                        icon={<FreighterIcon className="w-10 h-10" />}
                        accentColor="cyan"
                        size="large"
                        onClick={connectFreighter}
                        isLoading={isConnecting && walletType === null}
                      />

                      {/* Tile 2: Connect xBull (Medium) */}
                      <WalletTile
                        title="Connect xBull"
                        description="Multi-chain wallet"
                        icon={<XBullIcon className="w-8 h-8" />}
                        accentColor="violet"
                        size="medium"
                        onClick={connectXBull}
                        isLoading={isConnecting && walletType === null}
                      />

                      {/* Tile 3: Connect Albedo (Medium) */}
                      <WalletTile
                        title="Connect Albedo"
                        description="Web-signing wallet"
                        icon={<AlbedoIcon className="w-8 h-8" />}
                        accentColor="emerald"
                        size="medium"
                        onClick={connectAlbedo}
                        isLoading={isConnecting && walletType === null}
                      />

                      {/* Tile 4: What is Freighter? (Small) */}
                      <a
                        href="https://www.freighter.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                      >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                          What is Freighter?
                        </span>
                      </a>

                      {/* Tile 5: What is xBull? (Small) */}
                      <a
                        href="https://xbull.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                      >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                          What is xBull?
                        </span>
                      </a>

                      {/* Tile 6: What is Albedo? (Small) */}
                      <a
                        href="https://albedo.link/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                      >
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                        <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                          What is Albedo?
                        </span>
                      </a>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <StellarIcon className="w-4 h-4" />
                      <span>Powered by Stellar Network</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
