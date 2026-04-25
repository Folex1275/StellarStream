"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldCheck, Users } from "lucide-react";
import { useQuorumCheck } from "@/lib/hooks/use-quorum-check";
import { useWallet } from "@/lib/wallet-context";

function isValidGAddress(addr: string) {
  return /^G[A-Z2-7]{55}$/.test(addr.trim());
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Threshold Slider ─────────────────────────────────────────────────────────
function ThresholdSlider({
  required,
  total,
  onChange,
}: {
  required: number;
  total: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs tracking-widest text-white/40 uppercase">Signature Threshold</p>
        <span className="font-mono text-sm font-bold text-white">
          {required} <span className="text-white/40 font-normal">of</span> {total}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={Math.max(total, 1)}
        value={required}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={total === 0}
        className="w-full accent-cyan-400 disabled:opacity-30"
        aria-label="Required signatures"
      />
      <p className="text-xs text-white/30">
        Require <span className="text-cyan-400 font-semibold">{required}</span> admin
        {required !== 1 ? "s" : ""} to approve high-value operations.
      </p>
    </div>
  );
}

// ─── Admin List Manager ───────────────────────────────────────────────────────
function AdminList({
  admins,
  onAdd,
  onRemove,
}: {
  admins: string[];
  onAdd: (addr: string) => void;
  onRemove: (addr: string) => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    const addr = input.trim();
    if (!isValidGAddress(addr)) {
      setError("Must be a valid Stellar G-address (56 chars).");
      return;
    }
    if (admins.includes(addr)) {
      setError("Address already in list.");
      return;
    }
    onAdd(addr);
    setInput("");
    setError("");
  }

  return (
    <div className="space-y-3">
      <p className="text-xs tracking-widest text-white/40 uppercase">Signing Admins</p>

      {/* Add row */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="G…"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-white placeholder-white/20 outline-none focus:border-cyan-400/50"
          aria-label="New admin G-address"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-400/15 border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/25"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* List */}
      {admins.length === 0 ? (
        <p className="text-xs text-white/25 py-2">No admins added yet.</p>
      ) : (
        <ul className="space-y-2">
          {admins.map((addr) => (
            <li
              key={addr}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <span className="font-mono text-xs text-white/70">{truncate(addr)}</span>
              <button
                onClick={() => onRemove(addr)}
                aria-label={`Remove ${truncate(addr)}`}
                className="rounded-lg p-1 text-white/30 transition hover:bg-red-500/15 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminQuorumSettings() {
  const { signers, thresholds, isLoading } = useQuorumCheck();
  const { address } = useWallet();

  // Local state — in production, persist via API
  const [admins, setAdmins] = useState<string[]>(() =>
    signers.filter((s) => s.weight > 0).map((s) => s.key)
  );
  const [required, setRequired] = useState(thresholds.med || 1);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // TODO: call PATCH /api/v3/org/quorum with { admins, required }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Multi-Admin Quorum</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {isLoading ? "Loading on-chain data…" : `${signers.length} signer${signers.length !== 1 ? "s" : ""} on-chain`}
          </p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <ThresholdSlider
        required={required}
        total={admins.length}
        onChange={setRequired}
      />

      <div className="h-px bg-white/[0.06]" />

      <AdminList
        admins={admins}
        onAdd={(addr) => setAdmins((prev) => [...prev, addr])}
        onRemove={(addr) => setAdmins((prev) => prev.filter((a) => a !== addr))}
      />

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full rounded-xl bg-cyan-400 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-300 disabled:opacity-40"
        disabled={admins.length === 0}
      >
        {saved ? "✓ Saved" : "Save Quorum Config"}
      </button>
    </div>
  );
}
