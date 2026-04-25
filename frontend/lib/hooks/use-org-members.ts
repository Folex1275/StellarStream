"use client";

// lib/hooks/use-org-members.ts
// Issue #680 — Organization Member Directory Picker

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet } from "@/lib/wallet-context";

export interface OrgMember {
  address: string;
  role: "DRAFTER" | "APPROVER" | "EXECUTOR";
  displayName?: string;
  department?: string;
  email?: string;
}

export interface OrgMembersResponse {
  orgAddress: string;
  members: OrgMember[];
}

export interface UseOrgMembersResult {
  /** All members of the organization */
  members: OrgMember[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Filtered members based on search query */
  searchResults: OrgMember[];
  /** Members grouped by department */
  membersByDepartment: Record<string, OrgMember[]>;
  /** Refresh the member list */
  refresh: () => Promise<void>;
}

const API_BASE =
  process.env.NEXT_PUBLIC_NEBULA_WARP_INDEXER_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

/**
 * useOrgMembers - Fetch and manage organization member list
 */
export function useOrgMembers(orgAddress: string): UseOrgMembersResult {
  const { isConnected } = useWallet();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!orgAddress || !isConnected) {
      setMembers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/orgs/${encodeURIComponent(orgAddress)}/members`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch members (${response.status})`);
      }

      const data = (await response.json()) as OrgMembersResponse;
      setMembers(data.members || []);
    } catch (err) {
      console.error("[useOrgMembers] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setIsLoading(false);
    }
  }, [orgAddress, isConnected]);

  // Fetch on mount or when orgAddress changes
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Group members by department
  const membersByDepartment = useMemo(() => {
    const grouped: Record<string, OrgMember[]> = {};
    
    for (const member of members) {
      const dept = member.department || "Unassigned";
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(member);
    }
    
    return grouped;
  }, [members]);

  return {
    members,
    isLoading,
    error,
    searchResults: members, // Can be filtered by search query in the component
    membersByDepartment,
    refresh: fetchMembers,
  };
}

/**
 * MemberSearchResult - For use with autocomplete
 */
export interface MemberSearchResult {
  address: string;
  displayLabel: string;
  role: string;
  department?: string;
}

/**
 * useMemberSearch - Search/filter organization members
 */
export function useMemberSearch(
  members: OrgMember[],
  query: string
): MemberSearchResult[] {
  return useMemo(() => {
    if (!query.trim()) {
      return members.map((m) => ({
        address: m.address,
        displayLabel: m.displayName || m.address.slice(0, 8) + "..." + m.address.slice(-4),
        role: m.role,
        department: m.department,
      }));
    }

    const lowerQuery = query.toLowerCase();
    
    return members
      .filter(
        (m) =>
          m.address.toLowerCase().includes(lowerQuery) ||
          m.displayName?.toLowerCase().includes(lowerQuery) ||
          m.department?.toLowerCase().includes(lowerQuery) ||
          m.role.toLowerCase().includes(lowerQuery)
      )
      .map((m) => ({
        address: m.address,
        displayLabel: m.displayName || m.address.slice(0, 8) + "..." + m.address.slice(-4),
        role: m.role,
        department: m.department,
      }));
  }, [members, query]);
}
