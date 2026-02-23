"use client";

import SecurityPrivacyPage from "@/components/settings/SecurityPrivacyPage";

export default function SettingsPage() {
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
      </section>

      {/* ── Security & Privacy Suite (#157) ── */}
      <SecurityPrivacyPage />

    </div>
  );
}