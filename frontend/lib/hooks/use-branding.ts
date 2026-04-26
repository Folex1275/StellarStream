// lib/hooks/use-branding.ts

'use client';

import { useState, useEffect } from 'react';

// ── Type definitions ──────────────────────────────────────────────────────

export interface BrandingConfig {
  logoUrl: string | null;
  primaryColor: string; // CSS hex, e.g. "#00f5ff"
}

export interface UseBrandingReturn {
  config: BrandingConfig;
  saving: boolean;
  saveError: string | null;
  updateColor: (color: string) => void;
  updateLogo: (file: File) => void;
  saveConfig: () => Promise<void>;
  logoError: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB = 2,097,152 bytes
const STORAGE_KEY = 'stellar_branding';
const DEFAULT_CONFIG: BrandingConfig = {
  logoUrl: null,
  primaryColor: '#00f5ff',
};

// ── Pure validation function ──────────────────────────────────────────────

/**
 * Validates a logo file for upload.
 *
 * @param file - The File object to validate.
 * @returns `null` if the file is valid, or a descriptive error string if not.
 *
 * Requirements: 1.3, 1.4
 */
export function validateLogoFile(file: File): string | null {
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return `File type "${file.type}" is not supported. Please upload a PNG, JPG, or SVG.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File size ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the 2 MB limit.`;
  }
  return null;
}

// ── Persistence functions ─────────────────────────────────────────────────

/**
 * Loads branding config from localStorage.
 * Returns defaults if not found.
 *
 * Requirements: 1.8, 1.10
 */
export function loadBrandingConfig(): BrandingConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as BrandingConfig;
    }
  } catch (e) {
    console.error('Failed to load branding config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Saves branding config to localStorage.
 *
 * Requirements: 1.8, 1.11
 */
export function saveBrandingConfig(config: BrandingConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// ── Hook ──────────────────────────────────────────────────────────────────

/**
 * Hook for managing organization branding (logo and primary color).
 * Requirements: 1.6, 1.7, 1.8, 1.9, 1.10, 1.11
 */
export function useBranding(): UseBrandingReturn {
  const [config, setConfig] = useState<BrandingConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Load config on mount and apply CSS var
  useEffect(() => {
    const loaded = loadBrandingConfig();
    setConfig(loaded);
    document.documentElement.style.setProperty('--stellar-primary', loaded.primaryColor);
  }, []);

  const updateColor = (color: string) => {
    setConfig((prev) => ({ ...prev, primaryColor: color }));
    document.documentElement.style.setProperty('--stellar-primary', color);
  };

  const updateLogo = (file: File) => {
    const error = validateLogoFile(file);
    if (error) {
      setLogoError(error);
      return;
    }
    setLogoError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setConfig((prev) => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      saveBrandingConfig(config);
      setSaving(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save branding config');
      setSaving(false);
    }
  };

  return { config, saving, saveError, updateColor, updateLogo, saveConfig, logoError };
}
