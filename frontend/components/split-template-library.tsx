"use client";

// components/split-template-library.tsx
// Issue #783 — Split-Template Library
//
// "Save as Template" action + template list for reusing split configurations.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SplitTemplateRecipient, SplitTemplate } from "@/app/api/v3/split/templates/route";

interface SplitTemplateLibraryProps {
  /** Current split recipients to offer as a saveable template. */
  currentRecipients: SplitTemplateRecipient[];
  /** Called when the user selects a saved template to load. */
  onLoad: (recipients: SplitTemplateRecipient[]) => void;
}

export function SplitTemplateLibrary({
  currentRecipients,
  onLoad,
}: SplitTemplateLibraryProps) {
  const [templates, setTemplates] = useState<SplitTemplate[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v3/split/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), recipients: currentRecipients }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save template");
      }

      const template: SplitTemplate = await res.json();
      setTemplates((prev) => [template, ...prev]);
      setName("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }, [name, currentRecipients]);

  return (
    <div className="space-y-4">
      {/* Save as Template */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Save as Template
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name…"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-cyan-400/50"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || currentRecipients.length === 0}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-300 transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-[11px] text-red-400">{error}</p>
        )}
      </div>

      {/* Template list */}
      <AnimatePresence initial={false}>
        {templates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
              Saved Templates
            </p>
            <div className="space-y-2">
              {templates.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-[10px] text-white/35">
                      {t.recipients.length} recipient
                      {t.recipients.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => onLoad(t.recipients)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/60 hover:bg-white/5 transition-colors"
                  >
                    Load
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
