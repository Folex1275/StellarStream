"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";

/**
 * Hardcoded admin addresses — replace with a contract/API lookup in production.
 * Addresses are compared case-insensitively.
 */
const ADMIN_ADDRESSES: string[] = (
  process.env.NEXT_PUBLIC_ADMIN_ADDRESSES ?? ""
)
  .split(",")
  .map((a) => a.trim().toUpperCase())
  .filter(Boolean);

export type AdminGuardResult =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "authorized"; address: string };

/**
 * Returns the current admin-access status and redirects non-admins to /dashboard.
 */
export function useAdminGuard(): AdminGuardResult {
  const { isConnected, address, isConnecting } = useWallet();
  const router = useRouter();

  const isAdmin =
    isConnected &&
    !!address &&
    ADMIN_ADDRESSES.includes(address.toUpperCase());

  useEffect(() => {
    if (isConnecting) return;
    if (!isConnected || !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isConnected, isAdmin, isConnecting, router]);

  if (isConnecting) return { status: "loading" };
  if (!isConnected || !isAdmin) return { status: "unauthorized" };
  return { status: "authorized", address: address! };
}
