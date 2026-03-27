"use client";

import { useState, useEffect, useCallback } from "react";
import type { DraftProposal } from "@/app/api/v3/proposals/pending/route";
import { useSplitSync } from "@/lib/providers/SplitSyncProvider";

export type { DraftProposal };

export interface RejectPayload {
    proposalId: string;
    comment: string;
}

async function fetchPendingProposals(): Promise<DraftProposal[]> {
    const res = await fetch("/api/v3/proposals/pending");
    if (!res.ok) throw new Error("Failed to fetch proposals");
    const data = await res.json();
    return data.proposals as DraftProposal[];
}

async function postReject(payload: RejectPayload): Promise<void> {
    // TODO: wire to real backend endpoint
    // await fetch("/api/v3/proposals/reject", { method: "POST", body: JSON.stringify(payload) });
    await new Promise((r) => setTimeout(r, 1000));
}

export function useDraftProposals(pollIntervalMs = 30_000) {
    const { proposals, setProposals, activeEditors, connected } = useSplitSync();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

    const load = useCallback(async () => {
        try {
            const data = await fetchPendingProposals();
            // Only overwrite local state on initial load; after that the socket
            // keeps proposals fresh. We still poll as a fallback for missed events.
            setProposals(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [setProposals]);

    useEffect(() => {
        load();
        const id = setInterval(load, pollIntervalMs);
        return () => clearInterval(id);
    }, [load, pollIntervalMs]);

    const rejectProposal = useCallback(async (payload: RejectPayload) => {
        setRejectingIds((prev) => new Set(prev).add(payload.proposalId));
        try {
            await postReject(payload);
            setProposals((prev) => prev.filter((p) => p.id !== payload.proposalId));
        } finally {
            setRejectingIds((prev) => {
                const next = new Set(prev);
                next.delete(payload.proposalId);
                return next;
            });
        }
    }, [setProposals]);

    return { proposals, loading, error, rejectingIds, rejectProposal, refresh: load, activeEditors, connected };
}
