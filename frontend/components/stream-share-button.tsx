"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Stream Share Button Component
 * Issue #436 - "Stream Share" Social Preview
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A button that generates a unique public URL for a stream that can be
 * shared to prove payment/receipt. The URL follows the pattern:
 * stellarstream.app/v2/view/:id
 * 
 * Features:
 * - Copy to clipboard functionality
 * - Visual feedback on copy success
 * - Social media share options
 * - QR code generation for the share URL
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, Twitter, Link as LinkIcon, QrCode } from "lucide-react";

interface StreamShareButtonProps {
  streamId: string;
  streamName?: string;
  variant?: "icon" | "button" | "full";
  className?: string;
}

const BASE_URL = "https://stellarstream.app";

export default function StreamShareButton({
  streamId,
  streamName = "Stream",
  variant = "button",
  className = "",
}: StreamShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

  const shareUrl = `${BASE_URL}/view/${streamId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [shareUrl]);

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`Check out my StellarStream: ${streamName}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  // Generate a simple QR code placeholder (in production, use a proper QR library)
  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        .stream-share-container {
          display: inline-flex;
          position: relative;
          font-family: 'Outfit', sans-serif;
        }

        .share-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid rgba(0, 229, 255, 0.3);
          background: rgba(0, 229, 255, 0.1);
          color: #00f5ff;
        }

        .share-button:hover {
          background: rgba(0, 229, 255, 0.2);
          border-color: rgba(0, 229, 255, 0.5);
          transform: translateY(-1px);
        }

        .share-button.icon-only {
          padding: 10px;
        }

        .share-icon {
          width: 16px;
          height: 16px;
        }

        /* Copy Feedback */
        .copy-feedback {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          color: #00ff88;
        }

        /* Dropdown Menu */
        .share-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          background: rgba(10, 10, 20, 0.97);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          z-index: 100;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .share-dropdown {
            background: rgba(10, 10, 20, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .dropdown-icon {
          width: 18px;
          height: 18px;
          color: rgba(255, 255, 255, 0.5);
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 6px 0;
        }

        /* QR Code Modal */
        .qr-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .qr-modal-overlay {
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }

        .qr-modal {
          background: rgba(10, 10, 20, 0.95);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 20px;
          padding: 24px;
          text-align: center;
        }

        .qr-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin-bottom: 16px;
        }

        .qr-image {
          border-radius: 12px;
          border: 2px solid rgba(0, 229, 255, 0.2);
        }

        .qr-url {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 12px;
          word-break: break-all;
          max-width: 200px;
        }

        .qr-close {
          margin-top: 16px;
          padding: 8px 20px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .qr-close:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>

      <div className="stream-share-container">
        {/* Main Button */}
        <motion.button
          className={`share-button ${variant === "icon" ? "icon-only" : ""} ${className}`}
          onClick={handleCopy}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Copy share link"
        >
          {copied ? (
            <>
              <Check className="share-icon" />
              {variant !== "icon" && <span>Copied!</span>}
            </>
          ) : (
            <>
              <Copy className="share-icon" />
              {variant !== "icon" && <span>Share</span>}
            </>
          )}
        </motion.button>

        {/* Copy Success Feedback */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="copy-feedback"
              style={{ position: "absolute", top: "100%", right: 0, marginTop: 8 }}
            >
              <Check className="w-4 h-4" />
              Link copied to clipboard
            </motion.div>
          )}
        </AnimatePresence>

        {/* URL Display (for full variant) */}
        {variant === "full" && (
          <div
            style={{
              marginLeft: 12,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "monospace",
            }}
          >
            {shareUrl}
          </div>
        )}
      </div>
    </>
  );
}

// Standalone share modal component for more options
interface StreamShareModalProps {
  streamId: string;
  streamName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StreamShareModal({
  streamId,
  streamName,
  isOpen,
  onClose,
}: StreamShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${BASE_URL}/view/${streamId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`Check out my StellarStream: ${streamName}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="qr-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="qr-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="qr-title">Share Stream</h3>

        {/* QR Code */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
          alt="QR Code"
          className="qr-image"
        />

        {/* URL */}
        <p className="qr-url">{shareUrl}</p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              background: copied ? "rgba(0,255,136,0.2)" : "rgba(0,229,255,0.1)",
              border: `1px solid ${copied ? "rgba(0,255,136,0.3)" : "rgba(0,229,255,0.3)"}`,
              color: copied ? "#00ff88" : "#00f5ff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Link"}
          </button>

          <button
            onClick={handleTwitterShare}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(29, 161, 245, 0.1)",
              border: "1px solid rgba(29, 161, 245, 0.3)",
              color: "#1da1f2",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <Twitter className="w-4 h-4" />
            Share
          </button>
        </div>

        <button className="qr-close" onClick={onClose}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}