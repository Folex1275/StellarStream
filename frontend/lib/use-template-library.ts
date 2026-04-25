"use client";
import { useState, useEffect, useCallback } from "react";

export interface StreamTemplate {
  id: string;
  name: string;
  asset: string;
  recipientAddress: string;
  splitEnabled: boolean;
  splitAddress: string;
  splitPercent: number;
  totalAmount: string;
  rateType: "per-second" | "per-minute" | "per-hour" | "per-day";
  durationPreset: string;
  createdAt: string;
}

const KEY = "stellarstream_templates";

function load(): StreamTemplate[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function save(templates: StreamTemplate[]) {
  localStorage.setItem(KEY, JSON.stringify(templates));
}

export function useTemplateLibrary() {
  const [templates, setTemplates] = useState<StreamTemplate[]>([]);

  useEffect(() => { setTemplates(load()); }, []);

  const saveTemplate = useCallback((data: Omit<StreamTemplate, "id" | "createdAt">) => {
    const t: StreamTemplate = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTemplates((prev) => { const next = [t, ...prev]; save(next); return next; });
    return t;
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => { const next = prev.filter((t) => t.id !== id); save(next); return next; });
  }, []);

  const duplicateTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const src = prev.find((t) => t.id === id);
      if (!src) return prev;
      const copy: StreamTemplate = { ...src, id: crypto.randomUUID(), name: `${src.name} (copy)`, createdAt: new Date().toISOString() };
      const next = [copy, ...prev];
      save(next);
      return next;
    });
  }, []);

  const loadTemplate = useCallback((id: string): StreamTemplate | undefined => {
    return load().find((t) => t.id === id);
  }, []);

  return { templates, saveTemplate, deleteTemplate, duplicateTemplate, loadTemplate };
}
