"use client";

import { useRef, useEffect } from "react";
import { UserCheck } from "lucide-react";
import type { FuzzyMatchResult } from "@/lib/fuzzy-address-match";
import { truncateAddress } from "@/lib/fuzzy-address-match";

interface AddressFuzzyDropdownProps {
    matches: FuzzyMatchResult[];
    onSelect: (address: string) => void;
    onClose: () => void;
}

export function AddressFuzzyDropdown({
    matches,
    onSelect,
    onClose,
}: AddressFuzzyDropdownProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleMouseDown(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [onClose]);

    if (matches.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-white/10 bg-[#0d1117] shadow-xl"
        >
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Did you mean?
            </div>
            {matches.map((match, idx) => (
                <button
                    key={`${match.address}-${idx}`}
                    type="button"
                    onClick={() => onSelect(match.address)}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
                >
                    <UserCheck className="h-3 w-3 shrink-0 text-cyan-400/70" />
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[11px] text-white/80">
                            {match.name ? (
                                <>
                                    <span className="font-medium text-cyan-400/90">
                                        {match.name}
                                    </span>
                                    <span className="mx-1 text-white/20">·</span>
                                </>
                            ) : null}
                            <span className="font-mono text-white/50">
                                {truncateAddress(match.address)}
                            </span>
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
}

