"use client";

import { CheckCircle2, XCircle, Info, ExternalLink } from "lucide-react";
import { toast as sonnerToast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GlowToastVariant = "success" | "error" | "info";

export interface GlowToastOptions {
  title: string;
  description?: string;
  txHash?: string;
  duration?: number;
}

// ─── Glow colour map ──────────────────────────────────────────────────────────

const GLOW: Record<GlowToastVariant, { border: string; icon: string; bg: string }> = {
  success: {
    border: "rgba(0,245,255,0.35)",
    icon: "#00f5ff",
    bg: "rgba(0,245,255,0.08)",
  },
  error: {
    border: "rgba(255,59,100,0.35)",
    icon: "#ff3b64",
    bg: "rgba(255,59,100,0.08)",
  },
  info: {
    border: "rgba(138,0,255,0.35)",
    icon: "#b84dff",
    bg: "rgba(138,0,255,0.08)",
  },
};

const ICONS: Record<GlowToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={20} />,
  error: <XCircle size={20} />,
  info: <Info size={20} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

function GlowToastUI({
  variant,
  title,
  description,
  txHash,
  duration = 5000,
}: GlowToastOptions & { variant: GlowToastVariant }) {
  const g = GLOW[variant];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        minWidth: 340,
        maxWidth: 420,
        padding: "16px 18px 20px",
        background: "rgba(10,10,20,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${g.border}`,
        borderRadius: 16,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${g.border}`,
        overflow: "hidden",
      }}
    >
      {/* Glow sheen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 20% 20%, ${g.bg} 0%, transparent 60%)`,
          pointerEvents: "none",
          borderRadius: "inherit",
        }}
      />

      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 10,
          background: g.bg,
          border: `1px solid ${g.border}`,
          color: g.icon,
          boxShadow: `0 0 12px ${g.bg}`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {ICONS[variant]}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: 13, color: "rgba(232,234,246,0.7)", lineHeight: 1.5 }}>
            {description}
          </div>
        )}
        {txHash && (
          <a
            href={`https://stellar.expert/explorer/public/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
              padding: "5px 10px",
              background: "rgba(0,245,255,0.08)",
              border: "1px solid rgba(0,245,255,0.2)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              color: "#00f5ff",
              textDecoration: "none",
              width: "fit-content",
            }}
          >
            View on Stellar.Expert <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `${g.bg}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            background: `linear-gradient(90deg, ${g.icon}, ${g.border})`,
            boxShadow: `0 0 8px ${g.icon}`,
            animation: `glow-toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes glow-toast-progress {
          from { transform: translateX(0); }
          to   { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const glowToast = {
  streamCreated: (txHash: string) =>
    sonnerToast.custom(() => (
      <GlowToastUI
        variant="success"
        title="Stream Created"
        description="Your payment stream is now active."
        txHash={txHash}
        duration={6000}
      />
    ), { duration: 6000 }),

  withdrawalSuccess: (amount: string, token: string, txHash: string) =>
    sonnerToast.custom(() => (
      <GlowToastUI
        variant="success"
        title="Withdrawal Successful"
        description={`${amount} ${token} transferred to your wallet.`}
        txHash={txHash}
        duration={6000}
      />
    ), { duration: 6000 }),

  transactionFailed: (reason?: string) =>
    sonnerToast.custom(() => (
      <GlowToastUI
        variant="error"
        title="Transaction Failed"
        description={reason ?? "Please check your wallet and try again."}
        duration={7000}
      />
    ), { duration: 7000 }),

  custom: (variant: GlowToastVariant, opts: GlowToastOptions) =>
    sonnerToast.custom(() => (
      <GlowToastUI variant={variant} {...opts} />
    ), { duration: opts.duration ?? 5000 }),
};
