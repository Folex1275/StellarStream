"use client";

// components/dashboard/PolicyEditor.tsx
// DAO admin interface for creating and managing split approval policies.

import { useState } from "react";
import { usePolicies } from "@/lib/hooks/use-policies";
import type {
  SplitPolicy,
  PolicyCondition,
  PolicyConditionField,
  PolicyConditionOp,
} from "@/app/api/v3/policies/route";

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<PolicyConditionField, string> = {
  totalAmount:    "Total Amount",
  recipientCount: "Recipient Count",
  token:          "Token",
};

const OP_LABELS: Record<PolicyConditionOp, string> = {
  gt:  ">",
  gte: "≥",
  lt:  "<",
  lte: "≤",
  eq:  "=",
};

const TOKENS = ["USDC", "XLM", "AQUA", "STRM", "USDT"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function conditionSummary(c: PolicyCondition): string {
  return `${FIELD_LABELS[c.field]} ${OP_LABELS[c.op]} ${c.value}`;
}

// ─── Empty condition factory ──────────────────────────────────────────────────

function emptyCondition(): PolicyCondition {
  return { field: "totalAmount", op: "gt", value: 0 };
}

// ─── Condition Row ────────────────────────────────────────────────────────────

function ConditionRow({
  condition,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  condition: PolicyCondition;
  index: number;
  onChange: (c: PolicyCondition) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isToken = condition.field === "token";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Field */}
      <select
        value={condition.field}
        onChange={(e) =>
          onChange({
            ...condition,
            field: e.target.value as PolicyConditionField,
            value: e.target.value === "token" ? "USDC" : 0,
          })
        }
        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-cyan-400/40"
      >
        {(Object.keys(FIELD_LABELS) as PolicyConditionField[]).map((f) => (
          <option key={f} value={f} className="bg-gray-900">
            {FIELD_LABELS[f]}
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.op}
        onChange={(e) => onChange({ ...condition, op: e.target.value as PolicyConditionOp })}
        className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-cyan-400/40 w-16"
      >
        {(Object.keys(OP_LABELS) as PolicyConditionOp[]).map((op) => (
          <option key={op} value={op} className="bg-gray-900">
            {OP_LABELS[op]}
          </option>
        ))}
      </select>

      {/* Value */}
      {isToken ? (
        <select
          value={String(condition.value)}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-cyan-400/40"
        >
          {TOKENS.map((t) => (
            <option key={t} value={t} className="bg-gray-900">{t}</option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          min={0}
          value={Number(condition.value)}
          onChange={(e) => onChange({ ...condition, value: Number(e.target.value) })}
          className="w-28 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-cyan-400/40"
          placeholder="Value"
        />
      )}

      {canRemove && (
        <button
          onClick={onRemove}
          className="text-white/25 hover:text-red-400 transition-colors text-sm leading-none"
          title="Remove condition"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Policy Form ──────────────────────────────────────────────────────────────

interface PolicyFormProps {
  initial?: Partial<SplitPolicy>;
  onSave:   (draft: Omit<SplitPolicy, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
  saving:   boolean;
}

function PolicyForm({ initial, onSave, onCancel, saving }: PolicyFormProps) {
  const [name,              setName]              = useState(initial?.name ?? "");
  const [description,       setDescription]       = useState(initial?.description ?? "");
  const [requiredApprovals, setRequiredApprovals] = useState(initial?.requiredApprovals ?? 1);
  const [conditions,        setConditions]        = useState<PolicyCondition[]>(
    initial?.conditions?.length ? initial.conditions : [emptyCondition()],
  );

  const updateCondition = (i: number, c: PolicyCondition) =>
    setConditions((prev) => prev.map((x, idx) => (idx === i ? c : x)));

  const removeCondition = (i: number) =>
    setConditions((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!name.trim() || conditions.length === 0) return;
    await onSave({
      name:              name.trim(),
      description:       description.trim() || undefined,
      conditions,
      requiredApprovals,
      enabled:           initial?.enabled ?? true,
    });
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block font-body text-[10px] tracking-widest text-white/40 uppercase mb-1.5">
          Policy Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Large USDC Split"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block font-body text-[10px] tracking-widest text-white/40 uppercase mb-1.5">
          Description <span className="normal-case text-white/20">(optional)</span>
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Any USDC split over 10k requires 3 approvals"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/40"
        />
      </div>

      {/* Conditions */}
      <div>
        <label className="block font-body text-[10px] tracking-widest text-white/40 uppercase mb-2">
          Conditions <span className="normal-case text-white/20">(all must match)</span>
        </label>
        <div className="space-y-2">
          {conditions.map((c, i) => (
            <ConditionRow
              key={i}
              condition={c}
              index={i}
              onChange={(updated) => updateCondition(i, updated)}
              onRemove={() => removeCondition(i)}
              canRemove={conditions.length > 1}
            />
          ))}
        </div>
        <button
          onClick={() => setConditions((prev) => [...prev, emptyCondition()])}
          className="mt-2 font-body text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors"
        >
          + Add condition
        </button>
      </div>

      {/* Required approvals */}
      <div>
        <label className="block font-body text-[10px] tracking-widest text-white/40 uppercase mb-1.5">
          Required Approvals
        </label>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRequiredApprovals(n)}
              className="h-9 w-9 rounded-xl border text-sm font-bold transition-all duration-150"
              style={{
                borderColor: requiredApprovals === n ? "rgba(0,245,255,0.5)" : "rgba(255,255,255,0.08)",
                background:  requiredApprovals === n ? "rgba(0,245,255,0.1)" : "rgba(255,255,255,0.02)",
                color:       requiredApprovals === n ? "#00f5ff" : "rgba(255,255,255,0.35)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          className="rounded-xl bg-cyan-400 px-5 py-2 font-body text-xs font-bold text-black hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: "0 0 16px rgba(34,211,238,0.2)" }}
        >
          {saving ? "Saving…" : "Save Policy"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-5 py-2 font-body text-xs text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Policy Card ──────────────────────────────────────────────────────────────

function PolicyCard({
  policy,
  onToggle,
  onEdit,
  onDelete,
}: {
  policy:   SplitPolicy;
  onToggle: () => void;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-2xl border transition-all duration-200"
      style={{
        borderColor: policy.enabled ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.06)",
        background:  policy.enabled ? "rgba(0,245,255,0.03)" : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-body text-sm font-bold text-white/80 truncate">{policy.name}</p>
            <span
              className="flex-shrink-0 rounded-full px-2 py-0.5 font-body text-[9px] font-bold tracking-widest uppercase"
              style={{
                background: policy.enabled ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
                color:      policy.enabled ? "#34d399" : "rgba(255,255,255,0.25)",
                border:     `1px solid ${policy.enabled ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {policy.enabled ? "Active" : "Disabled"}
            </span>
          </div>

          {policy.description && (
            <p className="font-body text-xs text-white/35 mb-2">{policy.description}</p>
          )}

          {/* Conditions */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {policy.conditions.map((c, i) => (
              <span
                key={i}
                className="rounded-lg px-2 py-0.5 font-mono text-[10px]"
                style={{
                  background: "rgba(167,139,250,0.08)",
                  border:     "1px solid rgba(167,139,250,0.2)",
                  color:      "#a78bfa",
                }}
              >
                {conditionSummary(c)}
              </span>
            ))}
          </div>

          {/* Required approvals badge */}
          <div className="flex items-center gap-1.5">
            <span className="font-body text-[10px] text-white/30">Requires</span>
            <span
              className="rounded-lg px-2 py-0.5 font-body text-[10px] font-bold"
              style={{
                background: "rgba(0,245,255,0.08)",
                border:     "1px solid rgba(0,245,255,0.2)",
                color:      "#00f5ff",
              }}
            >
              {policy.requiredApprovals} approval{policy.requiredApprovals !== 1 ? "s" : ""}
            </span>
            <span className="font-body text-[10px] text-white/20">· Updated {fmtDate(policy.updatedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Toggle */}
          <button
            onClick={onToggle}
            title={policy.enabled ? "Disable policy" : "Enable policy"}
            className="rounded-lg border border-white/08 p-1.5 transition-colors hover:border-white/20"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: policy.enabled ? "#34d399" : "rgba(255,255,255,0.25)" }}>
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>

          {/* Edit */}
          <button
            onClick={onEdit}
            title="Edit policy"
            className="rounded-lg border border-white/08 p-1.5 text-white/30 hover:text-white/70 hover:border-white/20 transition-colors"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            title="Delete policy"
            className="rounded-lg border border-white/08 p-1.5 text-white/25 hover:text-red-400 hover:border-red-400/30 transition-colors"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PolicyEditor ─────────────────────────────────────────────────────────────

export function PolicyEditor() {
  const { policies, loading, error, create, update, remove, toggle } = usePolicies();
  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<SplitPolicy | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  const handleCreate = async (
    draft: Omit<SplitPolicy, "id" | "createdAt" | "updatedAt">,
  ) => {
    setSaving(true);
    setSaveError(null);
    try {
      await create(draft);
      setShowForm(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (
    draft: Omit<SplitPolicy, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError(null);
    try {
      await update({ id: editTarget.id, ...draft });
      setEditTarget(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this policy?")) return;
    await remove(id);
  };

  const activeCount = policies.filter((p) => p.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-body text-[10px] tracking-[0.12em] text-white/40 uppercase">
            {policies.length} polic{policies.length !== 1 ? "ies" : "y"} · {activeCount} active
          </p>
        </div>
        {!showForm && !editTarget && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 font-body text-xs font-bold text-black hover:bg-cyan-300 transition-colors"
            style={{ boxShadow: "0 0 16px rgba(34,211,238,0.2)" }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Policy
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.03] p-5">
          <p className="font-body text-[10px] tracking-widest text-cyan-400/60 uppercase mb-4">New Policy</p>
          <PolicyForm
            onSave={handleCreate}
            onCancel={() => { setShowForm(false); setSaveError(null); }}
            saving={saving}
          />
          {saveError && <p className="mt-2 font-body text-xs text-red-400">{saveError}</p>}
        </div>
      )}

      {/* Loading / error */}
      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center text-white/25 text-sm">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading policies…
        </div>
      )}
      {error && <p className="font-body text-xs text-red-400">{error}</p>}

      {/* Policy list */}
      {!loading && policies.length === 0 && !showForm && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <p className="font-body text-sm text-white/30">No policies yet.</p>
          <p className="font-body text-xs text-white/20 mt-1">
            Create one to enforce approval thresholds on large or complex splits.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {policies.map((policy) =>
          editTarget?.id === policy.id ? (
            <div key={policy.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-body text-[10px] tracking-widest text-white/40 uppercase mb-4">Edit Policy</p>
              <PolicyForm
                initial={policy}
                onSave={handleUpdate}
                onCancel={() => { setEditTarget(null); setSaveError(null); }}
                saving={saving}
              />
              {saveError && <p className="mt-2 font-body text-xs text-red-400">{saveError}</p>}
            </div>
          ) : (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onToggle={() => toggle(policy.id)}
              onEdit={() => { setEditTarget(policy); setShowForm(false); }}
              onDelete={() => handleDelete(policy.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}
