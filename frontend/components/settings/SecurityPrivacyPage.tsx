"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Wallet {
  id: string;
  address: string;
  label: string;
  type: "Freighter" | "Ledger" | "WalletConnect";
  connected: Date;
  primary: boolean;
  permissions: string[];
}

interface AlertSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_WALLETS: Wallet[] = [
  {
    id: "w1", address: "GBXQ...F91C", label: "Main Treasury Wallet",
    type: "Freighter", connected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    primary: true, permissions: ["Stream", "Vote", "Withdraw"],
  },
  {
    id: "w2", address: "GC7R...A22D", label: "Cold Storage",
    type: "Ledger", connected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    primary: false, permissions: ["Vote"],
  },
  {
    id: "w3", address: "GDME...3BC0", label: "Mobile Wallet",
    type: "WalletConnect", connected: new Date(Date.now() - 1000 * 60 * 60 * 2),
    primary: false, permissions: ["Stream", "Withdraw"],
  },
];

const INITIAL_ALERTS: AlertSetting[] = [
  { id: "a1", label: "Stream Completed",    description: "Notify when a payment stream reaches 100%",      enabled: true  },
  { id: "a2", label: "Large Withdrawals",   description: "Alert on withdrawals exceeding 10,000 USDC",     enabled: true  },
  { id: "a3", label: "Governance Votes",    description: "Remind me before active proposals expire",       enabled: false },
  { id: "a4", label: "Yield Milestones",    description: "Celebrate every 100 USDC in yield earned",       enabled: true  },
  { id: "a5", label: "New Stream Received", description: "Notify when someone initiates a stream to me",   enabled: false },
  { id: "a6", label: "Security Events",     description: "Immediate alerts for suspicious wallet activity", enabled: true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const WALLET_ICONS: Record<Wallet["type"], string> = {
  Freighter:     "✦",
  Ledger:        "▣",
  WalletConnect: "⟡",
};

const WALLET_COLORS: Record<Wallet["type"], string> = {
  Freighter:     "#00f5ff",
  Ledger:        "#a78bfa",
  WalletConnect: "#34d399",
};

const PERM_COLORS: Record<string, string> = {
  Stream:   "rgba(0,245,255,0.12)",
  Vote:     "rgba(167,139,250,0.12)",
  Withdraw: "rgba(52,211,153,0.12)",
};
const PERM_TEXT: Record<string, string> = {
  Stream:   "#00f5ff",
  Vote:     "#a78bfa",
  Withdraw: "#34d399",
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: 44, height: 24, borderRadius: 99, flexShrink: 0,
        background: enabled
          ? "linear-gradient(90deg, #00b4cc, #00f5ff)"
          : "rgba(255,255,255,0.08)",
        border: `1px solid ${enabled ? "#00f5ff44" : "rgba(255,255,255,0.1)"}`,
        cursor: "pointer", position: "relative",
        transition: "all .25s",
        boxShadow: enabled ? "0 0 12px #00f5ff44" : "none",
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: enabled ? 23 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        transition: "left .25s cubic-bezier(.34,1.56,.64,1)",
        display: "block",
      }} />
    </button>
  );
}

// ─── Shield SVG ───────────────────────────────────────────────────────────────
function ShieldIcon({ size = 32, glow = false, color = "#00f5ff" }: { size?: number; glow?: boolean; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{
      filter: glow ? `drop-shadow(0 0 8px ${color}88)` : "none",
      flexShrink: 0,
    }}>
      <path
        d="M16 3L4 7.5V15c0 6.5 5.2 11.8 12 13.5C22.8 26.8 28 21.5 28 15V7.5L16 3Z"
        fill={`${color}15`} stroke={color} strokeWidth={1.5} strokeLinejoin="round"
      />
      <path d="M11 16l3.5 3.5L21 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      {icon}
      <div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 3 }}>
          {sub}
        </p>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1 }}>
          {label}
        </h2>
      </div>
    </div>
  );
}

// ─── Bento Card ───────────────────────────────────────────────────────────────
function BentoCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "28px 28px",
      backdropFilter: "blur(20px)",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {/* Top shimmer */}
      <div style={{
        position: "absolute", top: 0, left: "8%", right: "8%", height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
        pointerEvents: "none",
      }} />
      {children}
    </div>
  );
}

// ─── Connected Wallets Card ───────────────────────────────────────────────────
function ConnectedWallets() {
  const [wallets, setWallets] = useState(INITIAL_WALLETS);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = (id: string) => {
    setRevoking(id);
    setTimeout(() => {
      setWallets(w => w.filter(x => x.id !== id));
      setRevoking(null);
    }, 600);
  };

  const handleSetPrimary = (id: string) => {
    setWallets(w => w.map(x => ({ ...x, primary: x.id === id })));
  };

  return (
    <BentoCard>
      <SectionHeader
        icon={<ShieldIcon size={36} glow color="#00f5ff" />}
        label="Connected Wallets"
        sub="Wallet Permissions"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {wallets.map((wallet) => {
          const color = WALLET_COLORS[wallet.type];
          const isRevoking = revoking === wallet.id;
          return (
            <div key={wallet.id} style={{
              background: wallet.primary ? `${color}08` : "rgba(255,255,255,0.02)",
              border: `1px solid ${wallet.primary ? `${color}25` : "rgba(255,255,255,0.06)"}`,
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              transition: "all .3s",
              opacity: isRevoking ? 0.3 : 1,
              transform: isRevoking ? "scale(0.97)" : "scale(1)",
            }}>
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${color}15`,
                border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color, fontSize: 16,
                boxShadow: wallet.primary ? `0 0 16px ${color}33` : "none",
              }}>
                {WALLET_ICONS[wallet.type]}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                    {wallet.label}
                  </span>
                  {wallet.primary && (
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: 1.5,
                      textTransform: "uppercase", color, padding: "2px 7px",
                      background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 99,
                    }}>Primary</span>
                  )}
                </div>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>
                  {wallet.address} · {wallet.type} · since {fmtDate(wallet.connected)}
                </p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {wallet.permissions.map(p => (
                    <span key={p} style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1,
                      textTransform: "uppercase", color: PERM_TEXT[p],
                      background: PERM_COLORS[p], border: `1px solid ${PERM_TEXT[p]}25`,
                      padding: "2px 8px", borderRadius: 99,
                    }}>{p}</span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {!wallet.primary && (
                  <button onClick={() => handleSetPrimary(wallet.id)} style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5,
                    textTransform: "uppercase", padding: "6px 12px", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(255,255,255,0.4)", cursor: "pointer",
                    transition: "all .15s",
                  }}>
                    Set Primary
                  </button>
                )}
                {!wallet.primary && (
                  <button onClick={() => handleRevoke(wallet.id)} style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5,
                    textTransform: "uppercase", padding: "6px 12px", borderRadius: 8,
                    border: "1px solid rgba(239,68,68,0.2)",
                    background: "rgba(239,68,68,0.06)",
                    color: "#f87171", cursor: "pointer",
                    transition: "all .15s",
                  }}>
                    Revoke
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect new wallet */}
      <button style={{
        width: "100%", marginTop: 14, padding: "12px",
        borderRadius: 14, border: "1px dashed rgba(0,245,255,0.2)",
        background: "rgba(0,245,255,0.03)",
        color: "rgba(0,245,255,0.5)",
        fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2,
        textTransform: "uppercase", cursor: "pointer",
        transition: "all .2s",
      }}
        onMouseEnter={e => {
          (e.target as HTMLButtonElement).style.borderColor = "rgba(0,245,255,0.4)";
          (e.target as HTMLButtonElement).style.color = "#00f5ff";
          (e.target as HTMLButtonElement).style.background = "rgba(0,245,255,0.06)";
        }}
        onMouseLeave={e => {
          (e.target as HTMLButtonElement).style.borderColor = "rgba(0,245,255,0.2)";
          (e.target as HTMLButtonElement).style.color = "rgba(0,245,255,0.5)";
          (e.target as HTMLButtonElement).style.background = "rgba(0,245,255,0.03)";
        }}
      >
        + Connect New Wallet
      </button>
    </BentoCard>
  );
}

// ─── Email Alerts Card ────────────────────────────────────────────────────────
function EmailAlerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [email, setEmail] = useState("user@stellar.org");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string, val: boolean) => {
    setAlerts(a => a.map(x => x.id === id ? { ...x, enabled: val } : x));
  };

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const enabledCount = alerts.filter(a => a.enabled).length;

  return (
    <BentoCard>
      <SectionHeader
        icon={
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(167,139,250,0.12)",
            border: "1px solid rgba(167,139,250,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#a78bfa",
            boxShadow: "0 0 16px rgba(167,139,250,0.2)",
          }}>✉</div>
        }
        label="Email Alerts"
        sub="Notifications"
      />

      {/* Email input row */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center", marginBottom: 20,
        padding: "12px 16px", borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, flexShrink: 0 }}>
          TO
        </span>
        {editing ? (
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#fff",
            }}
            autoFocus
          />
        ) : (
          <span style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            {email}
          </span>
        )}
        <button
          onClick={editing ? handleSave : () => setEditing(true)}
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5,
            textTransform: "uppercase", padding: "5px 12px", borderRadius: 7,
            border: `1px solid ${saved ? "rgba(52,211,153,0.4)" : "rgba(167,139,250,0.3)"}`,
            background: saved ? "rgba(52,211,153,0.1)" : "rgba(167,139,250,0.1)",
            color: saved ? "#34d399" : "#a78bfa", cursor: "pointer",
            transition: "all .2s",
          }}
        >
          {saved ? "✓ Saved" : editing ? "Save" : "Edit"}
        </button>
      </div>

      {/* Alert rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {alerts.map((alert) => (
          <div key={alert.id} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "13px 14px", borderRadius: 11,
            background: alert.enabled ? "rgba(255,255,255,0.025)" : "transparent",
            border: `1px solid ${alert.enabled ? "rgba(255,255,255,0.06)" : "transparent"}`,
            transition: "all .2s",
          }}>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600,
                color: alert.enabled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                marginBottom: 2, transition: "color .2s",
              }}>
                {alert.label}
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.4 }}>
                {alert.description}
              </p>
            </div>
            <Toggle enabled={alert.enabled} onChange={(v) => toggle(alert.id, v)} />
          </div>
        ))}
      </div>

      {/* Footer count */}
      <p style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1.5,
        color: "rgba(255,255,255,0.2)", textAlign: "right", marginTop: 14,
        textTransform: "uppercase",
      }}>
        {enabledCount} of {alerts.length} alerts active
      </p>
    </BentoCard>
  );
}

// ─── Privacy Mode Card ────────────────────────────────────────────────────────
function PrivacyMode() {
  const [privacyOn, setPrivacyOn]       = useState(false);
  const [anonymizeAddr, setAnonymizeAddr] = useState(true);
  const [hideBalances, setHideBalances]  = useState(false);
  const [optOutAnalytics, setOptOutAnalytics] = useState(false);
  const [twoFA, setTwoFA]               = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const privacyScore = [anonymizeAddr, hideBalances, optOutAnalytics, twoFA, privacyOn]
    .filter(Boolean).length;
  const scoreColor = privacyScore >= 4 ? "#34d399" : privacyScore >= 2 ? "#00f5ff" : "#f87171";
  const scoreLabel = privacyScore >= 4 ? "Fortified" : privacyScore >= 2 ? "Moderate" : "Exposed";

  const privacyRows = [
    { label: "Anonymize Wallet Addresses",  desc: "Show shortened addresses publicly",       val: anonymizeAddr,    set: setAnonymizeAddr    },
    { label: "Hide Portfolio Balances",     desc: "Mask balances from public stream views",  val: hideBalances,     set: setHideBalances     },
    { label: "Opt Out of Analytics",        desc: "Stop anonymous usage data collection",    val: optOutAnalytics,  set: setOptOutAnalytics  },
    { label: "Two-Factor Authentication",   desc: "Require approval for sensitive actions",  val: twoFA,            set: setTwoFA            },
  ];

  return (
    <BentoCard>
      <SectionHeader
        icon={
          <div style={{ position: "relative", flexShrink: 0 }}>
            <ShieldIcon size={36} glow={privacyOn} color={privacyOn ? "#34d399" : "#666688"} />
          </div>
        }
        label="Privacy Mode"
        sub="Security Settings"
      />

      {/* Privacy score banner */}
      <div style={{
        padding: "16px 20px", borderRadius: 14, marginBottom: 22,
        background: `${scoreColor}08`,
        border: `1px solid ${scoreColor}25`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16,
      }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2.5, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>
            Privacy Score
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {privacyScore * 20}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>/100</span>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 1.5,
              textTransform: "uppercase", padding: "3px 9px", borderRadius: 99,
              background: `${scoreColor}15`, border: `1px solid ${scoreColor}30`,
              color: scoreColor,
            }}>{scoreLabel}</span>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ flex: 1, maxWidth: 160 }}>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${privacyScore * 20}%`,
              background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
              boxShadow: `0 0 10px ${scoreColor}66`,
              transition: "width .4s cubic-bezier(.4,0,.2,1)",
            }} />
          </div>
        </div>
      </div>

      {/* Global privacy mode toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 18px", borderRadius: 14, marginBottom: 14,
        background: privacyOn ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${privacyOn ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.07)"}`,
        transition: "all .3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: privacyOn ? "#34d399" : "rgba(255,255,255,0.85)", transition: "color .2s" }}>
              Privacy Mode
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
              {privacyOn ? "All privacy features active" : "Enable all protections at once"}
            </p>
          </div>
        </div>
        <Toggle enabled={privacyOn} onChange={setPrivacyOn} />
      </div>

      {/* Individual toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
        {privacyRows.map(({ label, desc, val, set }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "13px 14px", borderRadius: 11,
            background: val ? "rgba(255,255,255,0.025)" : "transparent",
            border: `1px solid ${val ? "rgba(255,255,255,0.06)" : "transparent"}`,
            transition: "all .2s",
          }}>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600,
                color: val ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                marginBottom: 2, transition: "color .2s",
              }}>{label}</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                {desc}
              </p>
            </div>
            <Toggle enabled={val} onChange={set} />
          </div>
        ))}
      </div>

      {/* Session timeout */}
      <div style={{
        padding: "14px 18px", borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>
            Session Timeout
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
            Auto-lock wallet after inactivity
          </p>
        </div>
        <select
          value={sessionTimeout}
          onChange={e => setSessionTimeout(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "6px 12px",
            color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 11,
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="5"  style={{ background: "#111" }}>5 min</option>
          <option value="15" style={{ background: "#111" }}>15 min</option>
          <option value="30" style={{ background: "#111" }}>30 min</option>
          <option value="60" style={{ background: "#111" }}>1 hour</option>
          <option value="0"  style={{ background: "#111" }}>Never</option>
        </select>
      </div>
    </BentoCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SecurityPrivacyPage() {
  const KEYFRAMES = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .s-card-1 { animation: fadeUp .4s .05s ease both; }
    .s-card-2 { animation: fadeUp .4s .15s ease both; }
    .s-card-3 { animation: fadeUp .4s .25s ease both; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div style={{ minHeight: "100vh", padding: "0" }}>

        {/* ── Page Header ── */}
        <section style={{
          borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          padding: "32px 36px", marginBottom: 20,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -80, right: -80, width: 300, height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
                User Settings
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <ShieldIcon size={40} glow color="#00f5ff" />
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: -1, lineHeight: 1 }}>
                  Security & Privacy
                </h1>
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, maxWidth: 480 }}>
                Manage wallet permissions, configure notification alerts, and control your privacy settings from one secure hub.
              </p>
            </div>
            {/* Vault status chip */}
            <div style={{
              padding: "10px 18px", borderRadius: 12,
              border: "1px solid rgba(0,245,255,0.2)",
              background: "rgba(0,245,255,0.06)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00f5ff", boxShadow: "0 0 8px #00f5ff", display: "block" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, color: "#00f5ff", textTransform: "uppercase" }}>
                Vault Secured
              </span>
            </div>
          </div>
        </section>

        {/* ── Vertical Bento Stack ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="s-card-1"><ConnectedWallets /></div>
          <div className="s-card-2"><EmailAlerts /></div>
          <div className="s-card-3"><PrivacyMode /></div>
        </div>

      </div>
    </>
  );
}