"use client";

import { useState } from "react";
import SecurityPrivacyPage from "@/components/settings/SecurityPrivacyPage";
import GasManagementTile from "@/components/settings/GasManagementTile";
import { CustomDomainsCard } from "@/components/settings/CustomDomainsCard";
import { AdminQuorumSettings } from "@/components/settings/AdminQuorumSettings";
import { WebhookIntegrationsCard } from "@/components/settings/WebhookIntegrationsCard";
import GasLedger from "@/components/gasledger";
import { DeveloperSettingsCard } from "@/components/settings/DeveloperSettingsCard";
import { TeamManagementCard } from "@/components/settings/TeamManagementCard";
import { AdminSweepCard } from "@/components/settings/AdminSweepCard";

const TABS = ["General", "Security", "Integrations"] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("General");

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      {/* ── Page Header ── */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
          Settings
        </p>
        <h1 className="font-heading mt-2 text-3xl md:text-5xl">
          Protocol Preferences
        </h1>
        <p className="font-body mt-4 text-white/60">
          Manage wallet profile, notifications, and governance-related defaults.
        </p>

        {/* Tab bar */}
        <div className="mt-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                tab === t
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* ── General ── */}
      {tab === "General" && (
        <>
          <TeamManagementCard />
          <OrganizationAvatarBrandingCard />
          <CustomDomainsCard />
          <GasManagementTile />
          {/* Gas Ledger — transaction history (#1023) */}
          <GasLedger walletAddress="demo-wallet" />
        </>
      )}

      {/* ── Security ── */}
      {tab === "Security" && (
        <>
          <SecurityPrivacyPage />
          <AdminQuorumSettings />
          <div className="pt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-white/10" />
              <p className="font-body text-[10px] tracking-widest uppercase text-white/30">Advanced Settings</p>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <AdminSweepCard />
          </div>
        </>
      )}

      {/* ── Developer Settings ── */}
      <DeveloperSettingsCard />

      {/* ── Integrations (#996) ── */}
      {tab === "Integrations" && <WebhookIntegrationsCard />}
    </div>
  );
}
