"use client";
import { useState, useEffect } from "react";

export interface AssetProfile {
  code: string;
  issuer: string;
  homeDomain: string | null;
  totalSupply: string;
  verified: boolean;
  rating: number | null;
  iconUrl: string | null;
}

// Fetch from backend cache — replace with real endpoint
async function fetchAssetProfile(code: string, issuer?: string): Promise<AssetProfile> {
  // Real: GET /api/v1/assets/profile?code=USDC&issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
  await new Promise(r => setTimeout(r, 500));
  const VERIFIED = ["USDC","USDT","DAI","WBTC","ETH"];
  return {
    code,
    issuer: issuer ?? "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    homeDomain: code === "USDC" ? "centre.io" : code === "USDT" ? "tether.to" : null,
    totalSupply: code === "USDC" ? "43,200,000,000" : code === "USDT" ? "110,000,000,000" : "—",
    verified: VERIFIED.includes(code),
    rating: VERIFIED.includes(code) ? 5 : null,
    iconUrl: null,
  };
}

export function useAssetProfile(code: string | null) {
  const [profile, setProfile] = useState<AssetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!code) { setProfile(null); return; }
    setIsLoading(true);
    fetchAssetProfile(code).then(setProfile).finally(() => setIsLoading(false));
  }, [code]);

  return { profile, isLoading };
}
