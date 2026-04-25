"use client";

// components/dashboard/MemberPicker.tsx
// Issue #680 — Organization Member Directory Picker

import { useState, useRef, useEffect } from "react";
import { Search, Users, Check, X, ChevronDown } from "lucide-react";
import { useOrgMembers, type OrgMember, type MemberSearchResult } from "@/lib/hooks/use-org-members";

interface MemberPickerProps {
  /** Organization address to fetch members from */
  orgAddress: string;
  /** Currently selected members */
  selectedMembers: string[];
  /** Callback when selection changes */
  onSelectionChange: (addresses: string[]) => void;
  /** Maximum number of selections allowed */
  maxSelections?: number;
  /** Placeholder text */
  placeholder?: string;
}

export function MemberPicker({
  orgAddress,
  selectedMembers,
  onSelectionChange,
  maxSelections = 50,
  placeholder = "Search team members...",
}: MemberPickerProps) {
  const { members, isLoading, error, membersByDepartment, searchResults } = useOrgMembers(orgAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter members based on search query
  const filteredMembers = searchQuery.trim()
    ? members.filter(
        (m) =>
          m.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.department?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMember = (address: string) => {
    if (selectedMembers.includes(address)) {
      onSelectionChange(selectedMembers.filter((a) => a !== address));
    } else if (selectedMembers.length < maxSelections) {
      onSelectionChange([...selectedMembers, address]);
    }
  };

  const selectAllInDepartment = (department: string) => {
    const deptMembers = membersByDepartment[department] || [];
    const deptAddresses = deptMembers.map((m) => m.address);
    const newSelections = [...selectedMembers];
    
    for (const addr of deptAddresses) {
      if (!newSelections.includes(addr) && newSelections.length < maxSelections) {
        newSelections.push(addr);
      }
    }
    
    onSelectionChange(newSelections);
  };

  const getDisplayName = (member: OrgMember): string => {
    return member.displayName || `${member.address.slice(0, 6)}...${member.address.slice(-4)}`;
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
        Failed to load members: {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:border-[#8a00ff]/50 focus:outline-none focus:ring-1 focus:ring-[#8a00ff]/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Selected Members Badge */}
      {selectedMembers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedMembers.map((addr) => {
            const member = members.find((m) => m.address === addr);
            return (
              <span
                key={addr}
                className="inline-flex items-center gap-1 rounded-full border border-[#8a00ff]/30 bg-[#8a00ff]/10 px-2 py-1 text-xs text-[#c084fc]"
              >
                {getDisplayName(member!)}
                <button
                  onClick={() => toggleMember(addr)}
                  className="ml-0.5 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-white/10 bg-[#1a1a2e] shadow-xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 text-white/40">
              <span className="animate-pulse">Loading members...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-4 text-center text-white/40">
              {searchQuery ? "No members found" : "No members in organization"}
            </div>
          ) : (
            <>
              {/* Department Groups */}
              {Object.entries(membersByDepartment).map(([dept, deptMembers]) => {
                const filteredDept = searchQuery.trim()
                  ? deptMembers.filter(
                      (m) =>
                        m.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : deptMembers;

                if (filteredDept.length === 0) return null;

                return (
                  <div key={dept} className="border-b border-white/5 last:border-0">
                    {/* Department Header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-white/5 sticky top-0">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                        <Users className="h-3 w-3" />
                        {dept}
                        <span className="text-white/30">({filteredDept.length})</span>
                      </div>
                      {!searchQuery && (
                        <button
                          onClick={() => selectAllInDepartment(dept)}
                          className="text-[10px] text-[#8a00ff] hover:text-[#a855f7] font-medium"
                        >
                          Select All
                        </button>
                      )}
                    </div>

                    {/* Member List */}
                    {filteredDept.map((member) => {
                      const isSelected = selectedMembers.includes(member.address);
                      return (
                        <button
                          key={member.address}
                          onClick={() => toggleMember(member.address)}
                          disabled={!isSelected && selectedMembers.length >= maxSelections}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                            isSelected
                              ? "bg-[#8a00ff]/10"
                              : "hover:bg-white/5"
                          } ${!isSelected && selectedMembers.length >= maxSelections ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {getDisplayName(member)}
                            </p>
                            <p className="text-[10px] text-white/40 font-mono truncate">
                              {member.address}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded bg-white/5">
                              {member.role}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-[#8a00ff]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Selection Counter */}
      <div className="mt-1.5 text-[10px] text-white/30">
        {selectedMembers.length} / {maxSelections} selected
      </div>
    </div>
  );
}

/**
 * Compact version for inline use in forms
 */
export function MemberPickerInline({
  orgAddress,
  selectedMembers,
  onSelectionChange,
  maxSelections = 10,
}: Omit<MemberPickerProps, "placeholder">) {
  return (
    <MemberPicker
      orgAddress={orgAddress}
      selectedMembers={selectedMembers}
      onSelectionChange={onSelectionChange}
      maxSelections={maxSelections}
      placeholder="Add recipients..."
    />
  );
}
