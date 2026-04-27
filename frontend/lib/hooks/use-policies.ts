"use client";

// lib/hooks/use-policies.ts
// CRUD hook for DAO split policies. Syncs with /api/v3/policies which
// proxies to the backend validator.

import { useCallback, useEffect, useState } from "react";
import type { SplitPolicy } from "@/app/api/v3/policies/route";

export type { SplitPolicy };

export interface UsePoliciesReturn {
  policies:  SplitPolicy[];
  loading:   boolean;
  error:     string | null;
  create:    (draft: Omit<SplitPolicy, "id" | "createdAt" | "updatedAt">) => Promise<SplitPolicy>;
  update:    (patch: Partial<SplitPolicy> & { id: string }) => Promise<void>;
  remove:    (id: string) => Promise<void>;
  /** Toggle enabled/disabled without a full update */
  toggle:    (id: string) => Promise<void>;
  /**
   * Validate a proposal against all enabled policies.
   * Returns the first matching policy (highest requiredApprovals wins in practice),
   * or null if no policy triggers.
   */
  validate:  (totalAmount: number, token: string, recipientCount: number) => SplitPolicy | null;
}

export function usePolicies(): UsePoliciesReturn {
  const [policies, setPolicies] = useState<SplitPolicy[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/v3/policies")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load policies");
        return r.json() as Promise<SplitPolicy[]>;
      })
      .then((data) => { setPolicies(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  // ── Create ─────────────────────────────────────────────────────────────────

  const create = useCallback(
    async (draft: Omit<SplitPolicy, "id" | "createdAt" | "updatedAt">) => {
      const res = await fetch("/api/v3/policies", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("Failed to create policy");
      const created: SplitPolicy = await res.json();
      setPolicies((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  // ── Update ─────────────────────────────────────────────────────────────────

  const update = useCallback(
    async (patch: Partial<SplitPolicy> & { id: string }) => {
      const res = await fetch("/api/v3/policies", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update policy");
      const updated: SplitPolicy = await res.json();
      setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    },
    [],
  );

  // ── Remove ─────────────────────────────────────────────────────────────────

  const remove = useCallback(async (id: string) => {
    const res = await fetch("/api/v3/policies", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Failed to delete policy");
    setPolicies((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Toggle ─────────────────────────────────────────────────────────────────

  const toggle = useCallback(
    async (id: string) => {
      const policy = policies.find((p) => p.id === id);
      if (!policy) return;
      await update({ id, enabled: !policy.enabled });
    },
    [policies, update],
  );

  // ── Validate ───────────────────────────────────────────────────────────────

  const validate = useCallback(
    (totalAmount: number, token: string, recipientCount: number): SplitPolicy | null => {
      const enabled = policies.filter((p) => p.enabled);

      // Return the policy with the highest requiredApprovals that matches
      const matches = enabled.filter((policy) =>
        policy.conditions.every((c) => {
          const actual: number | string =
            c.field === "totalAmount"    ? totalAmount    :
            c.field === "recipientCount" ? recipientCount :
            token;

          const v = c.value;
          switch (c.op) {
            case "gt":  return Number(actual) >  Number(v);
            case "gte": return Number(actual) >= Number(v);
            case "lt":  return Number(actual) <  Number(v);
            case "lte": return Number(actual) <= Number(v);
            case "eq":  return String(actual) === String(v);
            default:    return false;
          }
        }),
      );

      if (matches.length === 0) return null;
      return matches.reduce((best, p) =>
        p.requiredApprovals > best.requiredApprovals ? p : best,
      );
    },
    [policies],
  );

  return { policies, loading, error, create, update, remove, toggle, validate };
}
