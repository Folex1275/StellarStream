"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBranding } from "@/lib/hooks/use-branding";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BentoCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

// ─── Bento Card ───────────────────────────────────────────────────────────────
function BentoCard({ children, style = {} }: BentoCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: "28px 28px",
        backdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Top shimmer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      {icon}
      <div>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: 3,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            marginBottom: 3,
          }}
        >
          {sub}
        </p>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          {label}
        </h2>
      </div>
    </div>
  );
}

// ─── Logo Icon ────────────────────────────────────────────────────────────────
function LogoIcon({ size = 32, color = "#00f5ff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect x="4" y="4" width="24" height="24" rx="4" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill={color} />
      <path d="M4 20l8-8 8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Color Icon ───────────────────────────────────────────────────────────────
function ColorIcon({ size = 32, color = "#00f5ff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="16" cy="16" r="10" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="6" fill={color} opacity="0.3" />
      <circle cx="16" cy="16" r="3" fill={color} />
    </svg>
  );
}

// ─── Preview Icon ─────────────────────────────────────────────────────────────
function PreviewIcon({ size = 32, color = "#00f5ff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect x="4" y="6" width="24" height="20" rx="2" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
      <path d="M16 14v4M12 16h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Logo Upload Card ─────────────────────────────────────────────────────────
function LogoUploadCard({ config, logoError, updateLogo }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateLogo(file);
    }
  };

  return (
    <BentoCard>
      <SectionHeader icon={<LogoIcon size={36} color="#00f5ff" />} label="Logo Upload" sub="Organization Logo" />

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "32px 24px",
          borderRadius: 14,
          border: "2px dashed rgba(0,245,255,0.2)",
          background: "rgba(0,245,255,0.03)",
          cursor: "pointer",
          transition: "all .2s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginBottom: 16,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,245,255,0.4)";
          (e.currentTarget as HTMLDivElement).style.background = "rgba(0,245,255,0.06)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,245,255,0.2)";
          (e.currentTarget as HTMLDivElement).style.background = "rgba(0,245,255,0.03)";
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(0,245,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          📁
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            Click to upload or drag and drop
          </p>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: 0.5,
            }}
          >
            PNG, JPG, SVG up to 2 MB
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Error message */}
      {logoError && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              color: "#f87171",
              lineHeight: 1.5,
            }}
          >
            {logoError}
          </p>
        </div>
      )}

      {/* Logo preview */}
      <div
        style={{
          padding: "16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
        }}
      >
        {config.logoUrl ? (
          <img
            src={config.logoUrl}
            alt="Logo preview"
            style={{
              maxWidth: "100%",
              maxHeight: 100,
              borderRadius: 8,
            }}
          />
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              No logo uploaded
            </p>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

// ─── Color Picker Card ────────────────────────────────────────────────────────
function ColorPickerCard({ config, updateColor }: any) {
  return (
    <BentoCard>
      <SectionHeader icon={<ColorIcon size={36} color="#00f5ff" />} label="Primary Color" sub="Brand Color" />

      {/* Color picker */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 24px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 16,
        }}
      >
        <input
          type="color"
          value={config.primaryColor}
          onChange={(e) => updateColor(e.target.value)}
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Current Color
          </p>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 16,
              color: config.primaryColor,
              fontWeight: 500,
              letterSpacing: 1,
            }}
          >
            {config.primaryColor.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Info */}
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: "rgba(255,255,255,0.25)",
          lineHeight: 1.6,
        }}
      >
        This color is applied to all interactive elements in your public Split-Link pages and PDF receipts.
      </p>
    </BentoCard>
  );
}

// ─── Live Preview Card ────────────────────────────────────────────────────────
function LivePreviewCard({ config }: any) {
  return (
    <BentoCard>
      <SectionHeader icon={<PreviewIcon size={36} color="#00f5ff" />} label="Live Preview" sub="Split-Link Preview" />

      {/* Mock Split-Link card */}
      <div
        style={{
          padding: "24px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header with logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Logo area */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt="Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span style={{ fontSize: 20, opacity: 0.3 }}>🏢</span>
            )}
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 2,
              }}
            >
              Your Organization
            </p>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: 0.5,
              }}
            >
              Payment Link
            </p>
          </div>
        </div>

        {/* Mock content */}
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: 1.5,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Recipient
          </p>
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 12,
            }}
          >
            alice@example.com
          </p>

          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: 1.5,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Amount
          </p>
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: config.primaryColor,
              marginBottom: 20,
            }}
          >
            $1,000.00 USDC
          </p>
        </div>

        {/* Action button */}
        <button
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: `linear-gradient(90deg, ${config.primaryColor}88, ${config.primaryColor})`,
            color: "#000",
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all .2s",
            boxShadow: `0 0 16px ${config.primaryColor}44`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 24px ${config.primaryColor}66`;
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${config.primaryColor}44`;
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          Claim Payment
        </button>

        {/* Footer */}
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            color: "rgba(255,255,255,0.15)",
            textAlign: "center",
            marginTop: 16,
            letterSpacing: 0.5,
          }}
        >
          Powered by StellarStream
        </p>
      </div>
    </BentoCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BrandingPage() {
  const { config, saving, saveError, updateColor, updateLogo, saveConfig, logoError } = useBranding();
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      await saveConfig();
      toast.success("Branding saved successfully!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save branding";
      setLastSaveError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Show error toast if saveError changes
  useEffect(() => {
    if (saveError && saveError !== lastSaveError) {
      setLastSaveError(saveError);
      toast.error(saveError);
    }
  }, [saveError, lastSaveError]);

  const KEYFRAMES = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .b-card-1 { animation: fadeUp .4s .05s ease both; }
    .b-card-2 { animation: fadeUp .4s .15s ease both; }
    .b-card-3 { animation: fadeUp .4s .25s ease both; }
    .b-save-btn { animation: fadeUp .4s .35s ease both; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div style={{ minHeight: "100vh", padding: "0" }}>
        {/* ── Page Header ── */}
        <section
          style={{
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            padding: "32px 36px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  letterSpacing: 3,
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Organization Settings
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <LogoIcon size={40} color="#00f5ff" />
                <h1
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  Brand Identity
                </h1>
              </div>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.7,
                  maxWidth: 480,
                }}
              >
                Customize your organization's public-facing appearance. Upload your logo and select a primary brand color that will appear on all Split-Link payment pages and PDF receipts.
              </p>
            </div>
            {/* Status chip */}
            <div
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: "1px solid rgba(0,245,255,0.2)",
                background: "rgba(0,245,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#00f5ff",
                  boxShadow: "0 0 8px #00f5ff",
                  display: "block",
                }}
              />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "#00f5ff",
                  textTransform: "uppercase",
                }}
              >
                {saving ? "Saving..." : "Ready"}
              </span>
            </div>
          </div>
        </section>

        {/* ── Vertical Bento Stack ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div className="b-card-1">
            <LogoUploadCard config={config} logoError={logoError} updateLogo={updateLogo} />
          </div>
          <div className="b-card-2">
            <ColorPickerCard config={config} updateColor={updateColor} />
          </div>
          <div className="b-card-3">
            <LivePreviewCard config={config} />
          </div>
        </div>

        {/* ── Save Button ── */}
        <div className="b-save-btn">
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 12,
              border: "1px solid rgba(0,245,255,0.3)",
              background: saving
                ? "rgba(0,245,255,0.1)"
                : "linear-gradient(90deg, rgba(0,245,255,0.2), rgba(0,245,255,0.1))",
              color: "#00f5ff",
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              transition: "all .2s",
              opacity: saving ? 0.6 : 1,
              boxShadow: saving ? "none" : "0 0 16px rgba(0,245,255,0.2)",
              letterSpacing: 0.5,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "linear-gradient(90deg, rgba(0,245,255,0.3), rgba(0,245,255,0.2))";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(0,245,255,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "linear-gradient(90deg, rgba(0,245,255,0.2), rgba(0,245,255,0.1))";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(0,245,255,0.2)";
              }
            }}
          >
            {saving ? "Saving Branding..." : "Save Branding"}
          </button>
        </div>
      </div>
    </>
  );
}
