"use client";

import type { ReactNode } from "react";
import { SplitSyncProvider } from "@/lib/providers/SplitSyncProvider";
import { useWallet } from "@/lib/wallet-context";

export function SplitSyncBridge({ children }: { children: ReactNode }) {
    const { address } = useWallet();
    return <SplitSyncProvider userAddress={address}>{children}</SplitSyncProvider>;
}
