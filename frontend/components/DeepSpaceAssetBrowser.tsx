"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, Shield, Check, ExternalLink, Loader2, Globe, Star } from "lucide-react";

/**
 * Asset type representing a Stellar or cross-chain asset
 */
export interface Asset {
  code: string;
  issuer?: string;
  name: string;
  domain?: string;
  icon?: string;
  decimals: number;
  totalSupply?: string;
  isVerified: boolean;
  stellarExpertRating?: number;
  anchorInfo?: {
    name: string;
    url: string;
    twitter?: string;
    logo?: string;
  };
  chain: "stellar" | "ethereum" | "polygon" | "solana" | "other";
}

/**
 * Known Stellar anchors for verification badges
 */
const KNOWN_ANCHORS: Record<string, { name: string; domain: string; logo?: string }> = {
  "circle.com": { name: "Circle", domain: "circle.com" },
  "stellar.org": { name: "Stellar Development Foundation", domain: "stellar.org" },
  "tempo.eu.com": { name: "Tempo", domain: "tempo.eu.com" },
  "moneygram.com": { name: "MoneyGram", domain: "moneygram.com" },
  "satoshipayment.com": { name: "SatoshiPay", domain: "satoshipayment.com" },
  "bitpay.com": { name: "BitPay", domain: "bitpay.com" },
  "anchor山羊.com": { name: "Anchorage", domain: "anchor山羊.com" },
  "ripple.com": { name: "Ripple", domain: "ripple.com" },
  "frankfurtermakler.de": { name: "Frankfurter Makler", domain: "frankfurtermakler.de" },
  "lobstr.co": { name: "LOBSTR", domain: "lobstr.co" },
  "keybase.io": { name: "Keybase", domain: "keybase.io" },
};

/**
 * Default verified assets (whitelist)
 */
const DEFAULT_ASSETS: Asset[] = [
  {
    code: "XLM",
    name: "Stellar Lumens",
    decimals: 7,
    isVerified: true,
    stellarExpertRating: 10,
    chain: "stellar",
    anchorInfo: { name: "Stellar Development Foundation", url: "https://stellar.org" },
  },
  {
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3I6J6AYGQL2S2KY7VPNB",
    name: "USD Coin",
    domain: "circle.com",
    decimals: 7,
    isVerified: true,
    stellarExpertRating: 9,
    chain: "stellar",
    anchorInfo: { name: "Circle", url: "https://circle.com" },
  },
  {
    code: "EURT",
    issuer: "GAKNDFKKZA3JSRT7B3ETTCSH5AXQ6FGK5JYWNKGPRZM5IUHLI6F3ENRXA",
    name: "Euro Token",
    domain: "tempo.eu.com",
    decimals: 7,
    isVerified: true,
    stellarExpertRating: 7,
    chain: "stellar",
    anchorInfo: { name: "Tempo", url: "https://tempo.eu.com" },
  },
  {
    code: "ARST",
    issuer: "GB7TAYRUZGE6TVT7NHD5M6NXJ4FZ5QM3DH3TZ4URZG4Y6XXYP6GBHRYSN",
    name: "Argentine Peso",
    domain: "tempo.eu.com",
    decimals: 7,
    isVerified: true,
    stellarExpertRating: 6,
    chain: "stellar",
    anchorInfo: { name: "Tempo", url: "https://tempo.eu.com" },
  },
  {
    code: "BRLT",
    issuer: "GDVKGZ6QOQ3KDJNA7IRU2XFK67MG5CNFFMNRPSJQ5WVBYLWNPJD7YWLN",
    name: "Brazilian Real",
    domain: "tempo.eu.com",
    decimals: 7,
    isVerified: true,
    stellarExpertRating: 5,
    chain: "stellar",
    anchorInfo: { name: "Tempo", url: "https://tempo.eu.com" },
  },
  {
    code: "MXNT",
    issuer: "GCZNF24HPMYTV6NOEHI7Q5RJFFUI23JKUKY3H3TNFHA3LO5V5A5WNHVX5",
    name: "Mexican Peso",
    domain: "tempo.eu.com",
    decimals: 7,
    isVerified: true,
    stellarExpertRating: 5,
    chain: "stellar",
    anchorInfo: { name: "Tempo", url: "https://tempo.eu.com" },
  },
  {
    code: "ETH",
    name: "Ethereum",
    decimals: 18,
    isVerified: true,
    stellarExpertRating: 8,
    chain: "ethereum",
  },
  {
    code: "BTC",
    name: "Bitcoin",
    decimals: 8,
    isVerified: true,
    stellarExpertRating: 8,
    chain: "other",
  },
];

/**
 * Props for DeepSpaceAssetBrowser
 */
export interface DeepSpaceAssetBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  selectedAsset?: Asset | null;
  /** API endpoint to fetch verified assets (optional) */
  apiEndpoint?: string;
  /** Whether to show cross-chain assets (default: true) */
  showCrossChain?: boolean;
}

/**
 * Asset icon component with gradient fallback
 */
function AssetIcon({ asset, size = 40 }: { asset: Asset; size?: number }) {
  if (asset.icon || asset.anchorInfo?.logo) {
    return (
      <img
        src={asset.icon || asset.anchorInfo?.logo}
        alt={asset.code}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  // Generate gradient based on code
  const hash = asset.code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue}, 80%, 60%), hsl(${(hue + 40) % 360}, 80%, 40%))`,
        boxShadow: `0 0 20px hsl(${hue}, 80%, 50%, 0.3)`,
      }}
    >
      {asset.code.charAt(0)}
    </div>
  );
}

/**
 * Verified badge component
 */
function VerifiedBadge({ anchor }: { anchor?: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
      <Shield size={12} className="text-blue-400" />
      <span className="text-xs text-blue-400 font-medium">
        {anchor ? "Verified" : "Native"}
      </span>
    </div>
  );
}

/**
 * Chain badge component
 */
function ChainBadge({ chain }: { chain: Asset["chain"] }) {
  const config = {
    stellar: { color: "text-cyan-400", bg: "bg-cyan-400/20", label: "Stellar" },
    ethereum: { color: "text-purple-400", bg: "bg-purple-400/20", label: "Ethereum" },
    polygon: { color: "text-indigo-400", bg: "bg-indigo-400/20", label: "Polygon" },
    solana: { color: "text-teal-400", bg: "bg-teal-400/20", label: "Solana" },
    other: { color: "text-gray-400", bg: "bg-gray-400/20", label: "Other" },
  };

  const { color, bg, label } = config[chain];

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color} ${bg}`}>
      {label}
    </span>
  );
}

/**
 * DeepSpaceAssetBrowser Component
 * 
 * A "Search & Select" modal for browsing and selecting cross-chain assets.
 * Features:
 * - Search by asset code, name, or domain
 * - Verified badges for known Stellar anchors
 * - Cross-chain asset support (Stellar, Ethereum, Polygon, Solana)
 * - Asset icons with gradient fallbacks
 * 
 * @example
 * ```tsx
 * <DeepSpaceAssetBrowser
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSelect={(asset) => console.log('Selected:', asset)}
 *   showCrossChain={true}
 * />
 * ```
 */
export function DeepSpaceAssetBrowser({
  isOpen,
  onClose,
  onSelect,
  selectedAsset,
  apiEndpoint,
  showCrossChain = true,
}: DeepSpaceAssetBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "verified" | "stellar" | "cross-chain" | "top-rated">("all");

  /**
   * Fetch assets from backend whitelist API
   */
  const fetchAssets = useCallback(async () => {
    if (!apiEndpoint) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint);
      if (!response.ok) throw new Error("Failed to fetch assets");
      const data = await response.json();
      setAssets(data.assets || data);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError("Failed to load assets. Using default list.");
      // Fall back to default assets
      setAssets(DEFAULT_ASSETS);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint]);

  // Fetch assets when modal opens and API endpoint is provided
  useEffect(() => {
    if (isOpen && apiEndpoint) {
      fetchAssets();
    }
  }, [isOpen, apiEndpoint, fetchAssets]);

  const TOP_RATED_THRESHOLD = 7;

  // Filter assets based on search and category
  const filteredAssets = useMemo(() => {
    let result = assets;

    // Filter by category
    if (selectedCategory === "verified") {
      result = result.filter((a) => a.isVerified);
    } else if (selectedCategory === "stellar") {
      result = result.filter((a) => a.chain === "stellar");
    } else if (selectedCategory === "cross-chain") {
      result = result.filter((a) => a.chain !== "stellar");
    } else if (selectedCategory === "top-rated") {
      result = result.filter(
        (a) => a.stellarExpertRating !== undefined && a.stellarExpertRating >= TOP_RATED_THRESHOLD
      );
    }

    // Filter by search query — supports code, name, domain, anchor name, and issuer address
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.code.toLowerCase().includes(query) ||
          asset.name.toLowerCase().includes(query) ||
          asset.domain?.toLowerCase().includes(query) ||
          asset.anchorInfo?.name.toLowerCase().includes(query) ||
          asset.issuer?.toLowerCase().includes(query)
      );
    }

    // Sort: verified first, then by rating descending, then alphabetically
    return result.sort((a, b) => {
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      const ratingDiff = (b.stellarExpertRating ?? 0) - (a.stellarExpertRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return a.code.localeCompare(b.code);
    });
  }, [assets, searchQuery, selectedCategory]);

  // Handle asset selection
  const handleSelect = (asset: Asset) => {
    onSelect(asset);
    setSearchQuery("");
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Globe size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Deep Space Asset Browser</h2>
              <p className="text-sm text-gray-400">Browse cross-chain assets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, name, domain, or issuer address..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
              autoFocus
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { id: "all", label: "All Assets" },
              { id: "verified", label: "Verified" },
              { id: "stellar", label: "Stellar" },
              { id: "cross-chain", label: "Cross-Chain" },
              { id: "top-rated", label: "★ Top Rated" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Asset List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-violet-500" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-gray-400">
              <p>{error}</p>
            </div>
          ) : filteredAssets.length > 0 ? (
            <div className="space-y-1">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset?.code === asset.code && 
                  selectedAsset?.issuer === asset.issuer;
                
                return (
                  <button
                    key={`${asset.code}-${asset.issuer || "native"}`}
                    onClick={() => handleSelect(asset)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group ${
                      isSelected
                        ? "bg-violet-500/20 border border-violet-500/30"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <AssetIcon asset={asset} size={44} />
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                          {asset.code}
                        </span>
                        {asset.isVerified && <VerifiedBadge anchor={asset.anchorInfo?.name} />}
                        <ChainBadge chain={asset.chain} />
                        {asset.stellarExpertRating !== undefined && (
                          <span
                            className="flex items-center gap-0.5 text-xs text-yellow-400"
                            title={`Stellar Expert Rating: ${asset.stellarExpertRating}/10`}
                          >
                            <Star size={11} className="fill-yellow-400" />
                            {asset.stellarExpertRating}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{asset.name}</p>
                      {asset.issuer && (
                        <p className="text-xs text-gray-500 font-mono mt-0.5" title={asset.issuer}>
                          {asset.issuer.slice(0, 6)}…{asset.issuer.slice(-6)}
                        </p>
                      )}
                      {asset.anchorInfo && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {asset.anchorInfo.name}
                          {asset.domain && ` • ${asset.domain}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Star size={16} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No assets found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
          <p className="text-xs text-gray-500">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? "s" : ""} available
          </p>
          <a
            href="#"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // Would open asset submission page
            }}
          >
            Submit new asset <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default DeepSpaceAssetBrowser;
