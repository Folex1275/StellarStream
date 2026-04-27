"use client";

/**
 * QR Studio — Issue #1015
 * Customise the QR code for a Split-Link: foreground/background colours,
 * optional org logo overlay, and a 300 DPI "Download for Print" export.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";
import { Download, Palette } from "lucide-react";

interface QRStudioProps {
  /** The URL encoded into the QR code */
  url: string;
  /** Optional org logo data-URL to embed in the centre */
  logoUrl?: string;
}

const PREVIEW_SIZE = 240; // px — on-screen canvas
const PRINT_SIZE = 1240; // px — ~300 DPI at 4 × 4 in

async function renderQR(
  canvas: HTMLCanvasElement,
  url: string,
  fg: string,
  bg: string,
  logoUrl: string | undefined,
  size: number
): Promise<void> {
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    color: { dark: fg, light: bg },
    errorCorrectionLevel: "H", // high — needed to survive logo occlusion
  });

  if (!logoUrl) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = logoUrl;
  });

  const logoSize = size * 0.22;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;
  const radius = logoSize * 0.18;

  // White backing circle so the logo is legible on any BG colour
  ctx.beginPath();
  ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2 + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Rounded-rect clip
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + logoSize - radius, y);
  ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + radius);
  ctx.lineTo(x + logoSize, y + logoSize - radius);
  ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - radius, y + logoSize);
  ctx.lineTo(x + radius, y + logoSize);
  ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, logoSize, logoSize);
  ctx.restore();
}

export function QRStudio({ url, logoUrl }: QRStudioProps) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [fg, setFg] = useState("#00f5ff");
  const [bg, setBg] = useState("#030305");
  const [downloading, setDownloading] = useState(false);

  const redraw = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    renderQR(canvas, url, fg, bg, logoUrl, PREVIEW_SIZE).catch(console.error);
  }, [url, fg, bg, logoUrl]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const offscreen = document.createElement("canvas");
      await renderQR(offscreen, url, fg, bg, logoUrl, PRINT_SIZE);
      const link = document.createElement("a");
      link.download = "split-link-qr-300dpi.png";
      link.href = offscreen.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-cyan-400" />
        <p className="text-sm font-semibold text-white/80 uppercase tracking-widest">QR Studio</p>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <canvas
          ref={previewRef}
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
          className="rounded-2xl border border-white/10 shadow-[0_0_24px_rgba(0,245,255,0.08)]"
        />
      </div>

      {/* Colour controls */}
      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-xs text-white/50 uppercase tracking-widest">Foreground</span>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <input
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="text-xs font-mono text-white/70">{fg}</span>
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-white/50 uppercase tracking-widest">Background</span>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="text-xs font-mono text-white/70">{bg}</span>
          </div>
        </label>
      </div>

      {/* Download */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {downloading ? "Generating…" : "Download for Print (300 DPI)"}
      </button>
    </div>
  );
}
