"use client";

import { useState } from "react";
import { Webhook, CheckCircle2, XCircle, Send } from "lucide-react";

type WebhookType = "discord" | "slack";

interface WebhookEntry {
  type: WebhookType;
  url: string;
  status: "connected" | "disconnected" | "testing";
}

const LABELS: Record<WebhookType, string> = {
  discord: "Discord",
  slack: "Slack",
};

const PLACEHOLDERS: Record<WebhookType, string> = {
  discord: "https://discord.com/api/webhooks/…",
  slack: "https://hooks.slack.com/services/…",
};

async function sendTestPing(url: string): Promise<boolean> {
  try {
    const res = await fetch("/api/v3/integrations/webhook-ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function StatusBadge({ status }: { status: WebhookEntry["status"] }) {
  if (status === "testing") {
    return (
      <span className="flex items-center gap-1 text-xs text-white/40">
        <span className="h-1.5 w-1.5 rounded-full bg-white/30 animate-pulse" />
        Testing…
      </span>
    );
  }
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Connected
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-white/30">
      <XCircle className="h-3.5 w-3.5" /> Disconnected
    </span>
  );
}

function WebhookCard({
  type,
  entry,
  onChange,
  onTest,
}: {
  type: WebhookType;
  entry: WebhookEntry;
  onChange: (url: string) => void;
  onTest: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{LABELS[type]}</span>
        <StatusBadge status={entry.status} />
      </div>
      <div className="flex gap-2">
        <input
          value={entry.url}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDERS[type]}
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-400/50 font-mono"
          aria-label={`${LABELS[type]} webhook URL`}
        />
        <button
          onClick={onTest}
          disabled={!entry.url || entry.status === "testing"}
          className="flex items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-3 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" /> Test
        </button>
      </div>
    </div>
  );
}

export function WebhookIntegrationsCard() {
  const [entries, setEntries] = useState<Record<WebhookType, WebhookEntry>>({
    discord: { type: "discord", url: "", status: "disconnected" },
    slack:   { type: "slack",   url: "", status: "disconnected" },
  });

  function setUrl(type: WebhookType, url: string) {
    setEntries((prev) => ({
      ...prev,
      [type]: { ...prev[type], url, status: "disconnected" },
    }));
  }

  async function handleTest(type: WebhookType) {
    const url = entries[type].url;
    if (!url) return;
    setEntries((prev) => ({ ...prev, [type]: { ...prev[type], status: "testing" } }));
    const ok = await sendTestPing(url);
    setEntries((prev) => ({
      ...prev,
      [type]: { ...prev[type], status: ok ? "connected" : "disconnected" },
    }));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/10 border border-indigo-400/20">
          <Webhook className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Webhook Integrations</h2>
          <p className="text-xs text-white/40 mt-0.5">Receive stream events in Discord or Slack.</p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {(["discord", "slack"] as WebhookType[]).map((type) => (
        <WebhookCard
          key={type}
          type={type}
          entry={entries[type]}
          onChange={(url) => setUrl(type, url)}
          onTest={() => handleTest(type)}
        />
      ))}
    </div>
  );
}
