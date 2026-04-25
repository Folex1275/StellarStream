"use client";

import { Pencil } from "lucide-react";

interface DraftEditingIndicatorProps {
    editorAddress: string;
    /** The current user's address — hides the banner if they are the editor */
    currentUserAddress?: string | null;
}

function shortenAddr(addr: string) {
    return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

/**
 * Shown on a proposal card when another user is actively editing it.
 * Prevents approvers from acting on a stale snapshot.
 */
export function DraftEditingIndicator({ editorAddress, currentUserAddress }: DraftEditingIndicatorProps) {
    if (editorAddress === currentUserAddress) return null;

    return (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-300">
            <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <Pencil size={11} className="shrink-0" />
            <span>
                <span className="font-mono font-semibold">{shortenAddr(editorAddress)}</span>
                {" "}is currently editing — changes may arrive shortly
            </span>
        </div>
    );
}
