"use client";

/**
 * components/nav.tsx
 * Modified for Issue #161 — Easter Egg: "The Stream Matrix"
 * Added: 5-click logo trigger to activate StreamMatrix component
 * Preserved: NetworkStatusOrb from main branch
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";
import { WalletConnectModal } from "./wallet-connect-modal";
import { StreamMatrix } from "./stream-matrix";
import NetworkStatusOrb from "./networkstatusorb";
import { Wallet, ChevronDown } from "lucide-react";

const navLinks = [
  { href: "#about",        label: "About" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#assets",       label: "Assets" },
  { href: "#FAQ",          label: "FAQ" },
];

const TRIGGER_CLICKS = 5;

export function Nav() {
  const { isConnected, address, openModal } = useWallet();

  const [clickCount, setClickCount]     = useState(0);
  const [matrixActive, setMatrixActive] = useState(false);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      const next = clickCount + 1;
      setClickCount(next);
      if (next >= TRIGGER_CLICKS) {
        e.preventDefault();
        setClickCount(0);
        setMatrixActive(true);
      }
    },
    [clickCount]
  );

  const handleMatrixClose = useCallback(() => {
    setMatrixActive(false);
  }, []);

  const formatAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <StreamMatrix active={matrixActive} onClose={handleMatrixClose} />

      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[60%] max-w-7xl z-50">
        <div className="flex items-center justify-between px-8 py-3 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">

          {/* Logo — click 5× to trigger Easter egg */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 group cursor-pointer select-none"
          >
            <span
              className="text-white font-bold tracking-tighter text-lg transition-all duration-150"
              style={{
                textShadow:
                  clickCount > 0
                    ? `0 0 ${clickCount * 4}px rgba(0,245,255,${clickCount * 0.15})`
                    : "none",
              }}
            >
              StellarStream
            </span>
          </Link>

          {/* Navigation Links */}
          <ul className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <li key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-400 transition-all duration-300 group-hover:w-full shadow-[0_0_8px_#22d3ee]" />
              </li>
            ))}
          </ul>

          {/* Network status orb (desktop only) */}
          <div className="hidden md:flex items-center mr-6">
            <NetworkStatusOrb congestionLevel={0.2} averageFee={0.001} size={16} />
          </div>

          {/* Wallet Connection Button */}
          {isConnected ? (
            <button
              onClick={openModal}
              className="relative inline-flex items-center justify-center gap-2 px-5 py-2 overflow-hidden font-medium transition-all bg-white/5 rounded-full border border-cyan-500/30 hover:border-cyan-500/50 group"
            >
              <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-cyan-500 rounded-full group-hover:w-56 group-hover:h-56 opacity-10" />
              <Wallet className="relative w-4 h-4 text-cyan-400" />
              <span className="relative text-cyan-400 text-sm font-semibold">
                {formatAddress(address)}
              </span>
              <ChevronDown className="relative w-3 h-3 text-cyan-400" />
            </button>
          ) : (
            <button
              onClick={openModal}
              className="relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-medium transition-all bg-white/5 rounded-full border border-white/10 group"
            >
              <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-cyan-500 rounded-full group-hover:w-56 group-hover:h-56 opacity-10" />
              <Wallet className="relative w-4 h-4 text-cyan-400 mr-2" />
              <span className="relative text-cyan-400 text-sm font-semibold group-hover:text-white transition-colors">
                Connect
              </span>
            </button>
          )}
        </div>
      </nav>

      <WalletConnectModal />
    </>
  );
}