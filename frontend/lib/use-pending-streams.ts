"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignatureStatus = "pending" | "signed" | "rejected";

export interface Signer {
    address: string;
    status: SignatureStatus;
    signedAt?: Date;
    rejectionNote?: string;
}

export interface PendingStream {
    id: string;
    streamId: string;
    recipient: string;
    sender: string;
    amount: number;
    token: string;
    ratePerSecond: number;
    duration: number; // in days
    createdAt: Date;
    expiresAt: Date;
    requiredSignatures: number;
    signers: Signer[];
    hasCurrentUserSigned: boolean;
    currentUserAddress: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CURRENT_USER = "GDZX...4KLM";

const INITIAL_PENDING_STREAMS: PendingStream[] = [
    {
        id: "pending-1",
        streamId: "0xa3f1…c290",
        recipient: "GBTY...8NOP",
        sender: "GABC...7XYZ",
        amount: 50000,
        token: "USDC",
        ratePerSecond: 0.02893,
        duration: 20,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 47),
        requiredSignatures: 3,
        signers: [
            { address: "GABC...7XYZ", status: "signed", signedAt: new Date(Date.now() - 1000 * 60 * 28) },
            { address: MOCK_CURRENT_USER, status: "pending" },
            { address: "GCQR...2STU", status: "pending" },
        ],
        hasCurrentUserSigned: false,
        currentUserAddress: MOCK_CURRENT_USER,
    },
    {
        id: "pending-2",
        streamId: "0xb7d4…e451",
        recipient: "GCQR...2STU",
        sender: "GDEF...3QRS",
        amount: 12500,
        token: "XLM",
        ratePerSecond: 0.00723,
        duration: 60,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22),
        requiredSignatures: 2,
        signers: [
            { address: MOCK_CURRENT_USER, status: "pending" },
            { address: "GDEF...3QRS", status: "signed", signedAt: new Date(Date.now() - 1000 * 60 * 90) },
        ],
        hasCurrentUserSigned: false,
        currentUserAddress: MOCK_CURRENT_USER,
    },
    {
        id: "pending-3",
        streamId: "0xc9e2…f782",
        recipient: "GDZX...4KLM",
        sender: "GBTY...8NOP",
        amount: 8000,
        token: "USDC",
        ratePerSecond: 0.00463,
        duration: 14,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 19),
        requiredSignatures: 4,
        signers: [
            { address: "GABC...7XYZ", status: "signed", signedAt: new Date(Date.now() - 1000 * 60 * 60 * 4) },
            { address: "GBTY...8NOP", status: "signed", signedAt: new Date(Date.now() - 1000 * 60 * 60 * 3) },
            { address: MOCK_CURRENT_USER, status: "signed", signedAt: new Date(Date.now() - 1000 * 60 * 60 * 1) },
            { address: "GCQR...2STU", status: "pending" },
        ],
        hasCurrentUserSigned: true,
        currentUserAddress: MOCK_CURRENT_USER,
    },
    {
        id: "pending-4",
        streamId: "0xd1a5…b903",
        recipient: "GHIJ...5VWX",
        sender: "GABC...7XYZ",
        amount: 25000,
        token: "USDC",
        ratePerSecond: 0.01447,
        duration: 30,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 16),
        requiredSignatures: 3,
        signers: [
            { address: "GABC...7XYZ", status: "signed", signedAt: new Date(Date.now() - 1000 * 60 * 60 * 7) },
            { address: MOCK_CURRENT_USER, status: "signed", signedAt: new Date(Date.now() - 1000 * 60 * 60 * 6) },
            { address: "GCQR...2STU", status: "rejected", rejectionNote: "Amount exceeds the approved Q2 budget ceiling of $20,000. Please revise and resubmit." },
        ],
        hasCurrentUserSigned: true,
        currentUserAddress: MOCK_CURRENT_USER,
    },
];

// ─── Soroban contract simulation ─────────────────────────────────────────────

/**
 * Signs a pending stream approval via the connected wallet (Freighter or Albedo).
 *
 * Flow:
 *  1. Build a Soroban transaction XDR for `approve_stream_request(streamId)`.
 *  2. Request the wallet extension to sign it.
 *  3. Submit the signed XDR to the Soroban RPC and return the tx hash.
 *
 * The XDR construction and submission are stubbed here; replace the marked
 * sections with real Soroban SDK calls when integrating with the chain.
 */
async function callApproveStreamRequest(streamId: string): Promise<{ txHash: string }> {
    // ── 1. Build unsigned XDR (stub) ──────────────────────────────────────────
    // Real implementation:
    //   const server = new SorobanRpc.Server(process.env.NEXT_PUBLIC_RPC_URL!);
    //   const contract = new Contract(process.env.NEXT_PUBLIC_CONTRACT_ID!);
    //   const account = await server.getAccount(signerAddress);
    //   const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    //     .addOperation(contract.call("approve_stream_request", nativeToScVal(streamId, { type: "string" })))
    //     .setTimeout(30)
    //     .build();
    //   const preparedTx = await server.prepareTransaction(tx);
    //   const unsignedXdr = preparedTx.toXDR();
    const unsignedXdr = `AAAAAQ...${streamId.slice(0, 8)}...stub_xdr`;

    // ── 2. Sign via wallet extension ──────────────────────────────────────────
    let signedXdr: string;

    if (typeof window !== "undefined" && (window as any).freighter) {
        // Freighter
        const { signTransaction } = await import("@stellar/freighter-api");
        const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "PUBLIC" : "TESTNET";
        const result = await signTransaction(unsignedXdr, { network });
        if ("error" in result && result.error) throw new Error(result.error);
        signedXdr = (result as any).signedTxXdr ?? unsignedXdr;
    } else if (typeof window !== "undefined" && (window as any).albedo) {
        // Albedo fallback
        const albedo = (window as any).albedo;
        const result = await albedo.tx({ xdr: unsignedXdr, submit: false });
        signedXdr = result.signed_envelope_xdr ?? unsignedXdr;
    } else {
        // Dev / test fallback — simulate latency
        await new Promise((resolve) => setTimeout(resolve, 1800 + Math.random() * 800));
        if (Math.random() < 0.1) {
            throw new Error("Transaction simulation failed: insufficient signers or network error");
        }
        signedXdr = unsignedXdr;
    }

    // ── 3. Submit signed XDR (stub) ───────────────────────────────────────────
    // Real implementation:
    //   const submitResult = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, networkPassphrase));
    //   if (submitResult.status === "ERROR") throw new Error(submitResult.errorResult?.result().toString());
    //   return { txHash: submitResult.hash };
    const mockTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    return { txHash: mockTxHash };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePendingStreams(pollIntervalMs = 15_000) {
    const [streams, setStreams] = useState<PendingStream[]>(INITIAL_PENDING_STREAMS);
    const [signingIds, setSigningIds] = useState<Set<string>>(new Set());
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    // Simulate poll for updates
    useEffect(() => {
        const id = setInterval(() => {
            setLastRefreshed(new Date());
            // In production, fetch from RPC / indexer here
        }, pollIntervalMs);
        return () => clearInterval(id);
    }, [pollIntervalMs]);

    const signStream = useCallback(
        async (pendingId: string): Promise<{ txHash: string }> => {
            setSigningIds((prev) => new Set(prev).add(pendingId));

            try {
                const stream = streams.find((s) => s.id === pendingId);
                if (!stream) throw new Error("Stream not found");

                const { txHash } = await callApproveStreamRequest(stream.streamId);

                setStreams((prev) =>
                    prev
                        .map((s) => {
                            if (s.id !== pendingId) return s;

                            const updatedSigners = s.signers.map((signer) =>
                                signer.address === s.currentUserAddress
                                    ? { ...signer, status: "signed" as SignatureStatus, signedAt: new Date() }
                                    : signer
                            );

                            const signedCount = updatedSigners.filter((sg) => sg.status === "signed").length;
                            const allSigned = signedCount >= s.requiredSignatures;

                            // Remove from queue if fully signed
                            if (allSigned) return null as unknown as PendingStream;

                            return {
                                ...s,
                                signers: updatedSigners,
                                hasCurrentUserSigned: true,
                            };
                        })
                        .filter(Boolean)
                );

                return { txHash };
            } finally {
                setSigningIds((prev) => {
                    const next = new Set(prev);
                    next.delete(pendingId);
                    return next;
                });
            }
        },
        [streams]
    );

    const signedCount = (stream: PendingStream) =>
        stream.signers.filter((s) => s.status === "signed").length;

    const restartProposal = useCallback((pendingId: string) => {
        setStreams((prev) =>
            prev.map((s) => {
                if (s.id !== pendingId) return s;
                return {
                    ...s,
                    hasCurrentUserSigned: false,
                    signers: s.signers.map((sg) => ({
                        address: sg.address,
                        status: "pending" as SignatureStatus,
                    })),
                };
            })
        );
    }, []);

    return {
        streams,
        signingIds,
        lastRefreshed,
        signStream,
        signedCount,
        restartProposal,
        currentUserAddress: MOCK_CURRENT_USER,
    };
}