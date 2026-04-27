"use client";

import React, { useState } from "react";
import { X, Filter, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

/**
 * Advanced Filter Sidebar for Transaction History
 * Provides multi-select filters for institutional-grade record management
 */

export interface TransactionFilters {
  status: string[];
  assetType: string[];
  senderRole: string[];
  amountMin: number | null;
  amountMax: number | null;
}

interface AdvancedFilterSidebarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const STATUS_OPTIONS = [
  { value: "Success", label: "Success", color: "#00f5ff" },
  { value: "Pending", label: "Pending", color: "#a0a0b4" },
  { value: "Failed", label: "Failed", color: "#9d4edd" },
];

const ASSET_OPTIONS = [
  { value: "XLM", label: "XLM", icon: "✦" },
  { value: "USDC", label: "USDC", icon: "◎" },
  { value: "STRM", label: "STRM", icon: "⟐" },
  { value: "AQUA", label: "AQUA", icon: "≋" },
];

const ROLE_OPTIONS = [
  { value: "sender", label: "Sender", icon: "→" },
  { value: "receiver", label: "Receiver", icon: "←" },
];

export default function AdvancedFilterSidebar({
  filters,
  onFiltersChange,
  onClearAll,
  isOpen,
  onToggle,
}: AdvancedFilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    asset: true,
    role: true,
    amount: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleMultiSelect = (
    category: keyof Pick<TransactionFilters, "status" | "assetType" | "senderRole">,
    value: string
  ) => {
    const current = filters[category] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    onFiltersChange({
      ...filters,
      [category]: updated,
    });
  };

  const handleAmountChange = (field: "amountMin" | "amountMax", value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    onFiltersChange({
      ...filters,
      [field]: numValue,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    count += filters.status.length;
    count += filters.assetType.length;
    count += filters.senderRole.length;
    if (filters.amountMin !== null) count++;
    if (filters.amountMax !== null) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .filter-section {
          animation: slideIn 0.3s ease-out;
        }
        .amount-input:focus {
          outline: none;
          border-color: rgba(0, 245, 255, 0.4) !important;
        }
        .filter-checkbox {
          accent-color: #00f5ff;
        }
      `}</style>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-200"
        style={{
          color: activeCount > 0 ? "#00f5ff" : "rgba(255,255,255,0.5)",
          borderColor: activeCount > 0 ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.1)",
        }}
      >
        <SlidersHorizontal size={16} />
        <span className="font-body text-xs font-bold tracking-wider uppercase">
          Filters
        </span>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400/30 text-[10px] font-bold text-cyan-400 px-1.5">
            {activeCount}
          </span>
        )}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onToggle}
          style={{ animation: "fadeIn 0.2s ease-out" }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
              <Filter size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Advanced Filters</h2>
              <p className="text-sm text-gray-400">
                {activeCount} filter{activeCount !== 1 ? "s" : ""} active
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Status Filter */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection("status")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="font-body text-xs font-bold text-white/70 uppercase tracking-wider">
                Status
              </h3>
              {expandedSections.status ? (
                <ChevronUp size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              )}
            </button>
            
            {expandedSections.status && (
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => toggleMultiSelect("status", option.value)}
                      className="filter-checkbox w-4 h-4 rounded border-white/30 bg-transparent cursor-pointer"
                    />
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                    <span className="font-body text-sm text-white/80">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Asset Type Filter */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection("asset")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="font-body text-xs font-bold text-white/70 uppercase tracking-wider">
                Asset Type
              </h3>
              {expandedSections.asset ? (
                <ChevronUp size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              )}
            </button>
            
            {expandedSections.asset && (
              <div className="space-y-2">
                {ASSET_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.assetType.includes(option.value)}
                      onChange={() => toggleMultiSelect("assetType", option.value)}
                      className="filter-checkbox w-4 h-4 rounded border-white/30 bg-transparent cursor-pointer"
                    />
                    <span className="text-base">{option.icon}</span>
                    <span className="font-body text-sm text-white/80">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sender Role Filter */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection("role")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="font-body text-xs font-bold text-white/70 uppercase tracking-wider">
                Sender Role
              </h3>
              {expandedSections.role ? (
                <ChevronUp size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              )}
            </button>
            
            {expandedSections.role && (
              <div className="space-y-2">
                {ROLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.senderRole.includes(option.value)}
                      onChange={() => toggleMultiSelect("senderRole", option.value)}
                      className="filter-checkbox w-4 h-4 rounded border-white/30 bg-transparent cursor-pointer"
                    />
                    <span className="text-base">{option.icon}</span>
                    <span className="font-body text-sm text-white/80">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Amount Range Filter */}
          <div className="filter-section">
            <button
              onClick={() => toggleSection("amount")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h3 className="font-body text-xs font-bold text-white/70 uppercase tracking-wider">
                Amount Range
              </h3>
              {expandedSections.amount ? (
                <ChevronUp size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              )}
            </button>
            
            {expandedSections.amount && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-body text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                      Min
                    </label>
                    <input
                      type="number"
                      value={filters.amountMin ?? ""}
                      onChange={(e) => handleAmountChange("amountMin", e.target.value)}
                      placeholder="0"
                      className="amount-input w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                      Max
                    </label>
                    <input
                      type="number"
                      value={filters.amountMax ?? ""}
                      onChange={(e) => handleAmountChange("amountMax", e.target.value)}
                      placeholder="∞"
                      className="amount-input w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Clear All */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/20">
          <button
            onClick={() => {
              onClearAll();
              onToggle();
            }}
            disabled={activeCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={14} />
            Clear All Filters
          </button>
        </div>
      </div>
    </>
  );
}
