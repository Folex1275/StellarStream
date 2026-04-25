"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, Plus, Trash2, Copy, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTemplateLibrary, type StreamTemplate } from "@/lib/use-template-library";

const ASSETS = ["USDC","USDT","DAI","ETH","WBTC"];
const DURATIONS = ["1 Hour","1 Day","1 Week","1 Month","3 Months","1 Year"];
const RATES = ["per-second","per-minute","per-hour","per-day"];

function TemplateCard({ t, onLoad, onDuplicate, onDelete }: {
  t: StreamTemplate;
  onLoad: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <motion.div layout initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.96 }}
      className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-base font-semibold text-white truncate">{t.name}</p>
          <p className="font-body text-xs text-white/40 mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[#00f5ff]/25 bg-[#00f5ff]/10 px-2.5 py-0.5 font-ticker text-xs text-[#00f5ff]">{t.asset}</span>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-white/30">Recipient</span>
          <span className="font-ticker text-white/60 truncate ml-2 max-w-[140px]">{t.recipientAddress ? `${t.recipientAddress.slice(0,8)}…` : "—"}</span>
        </div>
        {t.splitEnabled && (
          <div className="flex justify-between">
            <span className="text-white/30">Split</span>
            <span className="font-ticker text-[#8a00ff]">{t.splitPercent}% → {t.splitAddress.slice(0,8)}…</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-white/30">Amount</span>
          <span className="font-ticker text-white/60">{t.totalAmount || "—"} {t.asset}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Duration</span>
          <span className="font-ticker text-white/60">{t.durationPreset}</span>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onLoad}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#00f5ff]/25 bg-[#00f5ff]/8 py-2 text-xs font-medium text-[#00f5ff] hover:bg-[#00f5ff]/15 transition-colors">
          <ArrowRight className="h-3.5 w-3.5" /> Load
        </button>
        <button onClick={onDuplicate}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/60 hover:bg-white/10 transition-colors">
          <Copy className="h-3.5 w-3.5" />
        </button>
        {confirmDelete ? (
          <button onClick={onDelete}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/25 transition-colors">
            Confirm
          </button>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/40 hover:border-red-500/30 hover:text-red-400 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, saveTemplate, deleteTemplate, duplicateTemplate } = useTemplateLibrary();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", asset:"USDC", recipientAddress:"", splitEnabled:false, splitAddress:"", splitPercent:10, totalAmount:"", rateType:"per-hour", durationPreset:"1 Month" });

  function handleLoad(t: StreamTemplate) {
    sessionStorage.setItem("stellarstream_load_template", JSON.stringify(t));
    router.push("/dashboard/create-stream");
  }

  function handleSave() {
    if (!form.name.trim()) return;
    saveTemplate(form);
    setShowForm(false);
    setForm({ name:"", asset:"USDC", recipientAddress:"", splitEnabled:false, splitAddress:"", splitPercent:10, totalAmount:"", rateType:"per-hour", durationPreset:"1 Month" });
  }

  return (
    <div className="space-y-6 p-6 pb-24 md:pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#8a00ff]/25 bg-[#8a00ff]/10">
            <LayoutTemplate className="h-6 w-6 text-[#8a00ff]" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-white">Template Library</h1>
            <p className="font-body mt-1 text-sm text-white/50">Save and reuse split configurations for payroll or vendor payments.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-[#8a00ff]/30 bg-[#8a00ff]/10 px-4 py-2.5 font-body text-sm font-medium text-[#c084fc] hover:bg-[#8a00ff]/20 transition-colors">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Template"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="glass-card p-5 space-y-4">
            <p className="font-body text-xs uppercase tracking-widest text-white/30">New Template</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label:"Name", key:"name", type:"text", placeholder:"e.g. Monthly Payroll" },
                { label:"Recipient Address", key:"recipientAddress", type:"text", placeholder:"GABC…" },
                { label:"Total Amount", key:"totalAmount", type:"text", placeholder:"1000" },
              ].map(f => (
                <div key={f.key}>
                  <p className="font-body text-[10px] uppercase tracking-widest text-white/30 mb-1">{f.label}</p>
                  <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-sm text-white outline-none focus:border-[#8a00ff]/40 placeholder:text-white/20" />
                </div>
              ))}
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest text-white/30 mb-1">Asset</p>
                <div className="flex gap-1.5 flex-wrap">
                  {ASSETS.map(a => (
                    <button key={a} onClick={() => setForm(p => ({ ...p, asset:a }))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${form.asset===a ? "border-[#00f5ff]/40 bg-[#00f5ff]/10 text-[#00f5ff]" : "border-white/10 bg-white/5 text-white/40 hover:text-white/70"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest text-white/30 mb-1">Duration</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DURATIONS.map(d => (
                    <button key={d} onClick={() => setForm(p => ({ ...p, durationPreset:d }))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${form.durationPreset===d ? "border-[#00f5ff]/40 bg-[#00f5ff]/10 text-[#00f5ff]" : "border-white/10 bg-white/5 text-white/40 hover:text-white/70"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="w-full rounded-xl border border-[#8a00ff]/30 bg-[#8a00ff]/15 py-2.5 font-body text-sm font-medium text-[#c084fc] hover:bg-[#8a00ff]/25 transition-colors disabled:opacity-40">
              Save Template
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {templates.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
          <LayoutTemplate className="h-10 w-10 text-white/15" />
          <p className="font-body text-white/40">No templates yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {templates.map(t => (
              <TemplateCard key={t.id} t={t}
                onLoad={() => handleLoad(t)}
                onDuplicate={() => duplicateTemplate(t.id)}
                onDelete={() => deleteTemplate(t.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
