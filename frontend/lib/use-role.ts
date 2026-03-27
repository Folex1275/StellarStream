"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet-context";

// ─── Role definitions ─────────────────────────────────────────────────────────

/**
 * Organisation-level roles that gate frontend UI actions.
 * These are distinct from the on-chain RBAC roles (Admin / Pauser / TreasuryManager)
 * and are resolved from the backend session / JWT.
 *
 * Hierarchy (highest → lowest):
 *   ADMIN > EXECUTOR > TREASURY_MANAGER > VIEWER
 */
export type OrgRole = "ADMIN" | "EXECUTOR" | "TREASURY_MANAGER" | "VIEWER";

const ROLE_RANK: Record<OrgRole, number> = {
    ADMIN: 4,
    EXECUTOR: 3,
    TREASURY_MANAGER: 2,
    VIEWER: 1,
};

/** Returns true if `role` meets or exceeds `required`. */
export function hasMinRole(role: OrgRole, required: OrgRole): boolean {
    return ROLE_RANK[role] >= ROLE_RANK[required];
}

// ─── Permission map ───────────────────────────────────────────────────────────

export type Permission =
    | "submit_to_ledger"   // EXECUTOR+
    | "approve_proposal"   // EXECUTOR+
    | "reject_proposal"    // EXECUTOR+
    | "edit_draft"         // TREASURY_MANAGER+
    | "delete_draft"       // ADMIN only
    | "execute_action"     // EXECUTOR+
    | "manage_gas_buffer"  // TREASURY_MANAGER+
    | "view_only";         // all roles

const PERMISSION_MIN_ROLE: Record<Permission, OrgRole> = {
    submit_to_ledger: "EXECUTOR",
    approve_proposal: "EXECUTOR",
    reject_proposal: "EXECUTOR",
    edit_draft: "TREASURY_MANAGER",
    delete_draft: "ADMIN",
    execute_action: "EXECUTOR",
    manage_gas_buffer: "TREASURY_MANAGER",
    view_only: "VIEWER",
};

export function can(role: OrgRole, permission: Permission): boolean {
    return hasMinRole(role, PERMISSION_MIN_ROLE[permission]);
}

// ─── Role resolution ──────────────────────────────────────────────────────────

/**
 * Resolves the org role for a wallet address.
 * Replace the mock lookup with a real API/JWT call:
 *   GET /api/v3/auth/role  →  { role: OrgRole }
 */
async function fetchOrgRole(address: string): Promise<OrgRole> {
    // TODO: replace with real fetch
    // const res = await fetch("/api/v3/auth/role", { headers: { "x-wallet": address } });
    // return (await res.json()).role as OrgRole;

    // Mock: derive role from address suffix for local dev
    await new Promise((r) => setTimeout(r, 200));
    const suffix = address.slice(-1).toUpperCase();
    if ("ABCD".includes(suffix)) return "ADMIN";
    if ("EFGH".includes(suffix)) return "EXECUTOR";
    if ("IJKL".includes(suffix)) return "TREASURY_MANAGER";
    return "VIEWER";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseRoleResult =
    | { status: "loading"; role: null }
    | { status: "unauthenticated"; role: null }
    | { status: "ready"; role: OrgRole; can: (p: Permission) => boolean };

export function useRole(): UseRoleResult {
    const { isConnected, address, isConnecting } = useWallet();
    const [role, setRole] = useState<OrgRole | null>(null);

    useEffect(() => {
        if (!isConnected || !address) {
            setRole(null);
            return;
        }
        let cancelled = false;
        fetchOrgRole(address).then((r) => {
            if (!cancelled) setRole(r);
        });
        return () => { cancelled = true; };
    }, [isConnected, address]);

    if (isConnecting || (isConnected && role === null)) return { status: "loading", role: null };
    if (!isConnected || !address) return { status: "unauthenticated", role: null };
    return { status: "ready", role, can: (p) => can(role!, p) };
}
