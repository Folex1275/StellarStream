"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Team Member Invitation Landing Page
 * Collaborator-Invite Workflow
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * High-trust welcome interface for new team members invited to join an org.
 * Features:
 * - Org identity display (name & logo)
 * - SEP-10 wallet challenge to verify G-address
 * - Role preview with permission explanations
 * - Accept/reject functionality
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Wallet,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader,
  ArrowRight,
  Copy,
} from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { signTransaction } from "@stellar/freighter-api";
import { RolePreviewCard } from "@/components/invite/RolePreviewCard";
import { InviteOrgCard } from "@/components/invite/InviteOrgCard";

type InviteStatus =
  | "loading"
  | "ready"
  | "authenticating"
  | "verified"
  | "error"
  | "accepted"
  | "rejected";

interface InviteData {
  id: string;
  orgId: string;
  orgName: string;
  orgLogo?: string;
  recipient: string;
  role: "Admin" | "Accountant" | "Viewer";
  invitedAt: string;
  invitedBy?: string;
}

export default function InviteLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { address, isConnected, connectFreighter } = useWallet();
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [status, setStatus] = useState<InviteStatus>("loading");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch invite details on mount
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/v3/org/invites/${token}`);
        if (!response.ok) throw new Error("Invite not found or expired");
        const data = await response.json();
        setInviteData(data.invite);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invite");
        setStatus("error");
      }
    };

    if (token) fetchInvite();
  }, [token]);

  const handleConnectWallet = async () => {
    try {
      await connectFreighter();
    } catch (err) {
      setError("Failed to connect wallet");
    }
  };

  const handleVerifyAndAccept = async () => {
    if (!isConnected || !address || !inviteData) {
      setError("Wallet not connected");
      return;
    }

    setStatus("authenticating");
    setError("");

    try {
      // Step 1: Get challenge for this specific invite
      const challengeResponse = await fetch("/api/v3/org/invites/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken: token,
          address,
        }),
      });

      if (!challengeResponse.ok) {
        throw new Error("Failed to get verification challenge");
      }

      const { nonce, challenge } = await challengeResponse.json();

      // Step 2: Sign the challenge with wallet
      const message = `Accept StellarStream Team Invite\n\nOrganization: ${inviteData.orgName}\nRole: ${inviteData.role}\nAddress: ${address}\nChallenge: ${challenge}`;

      const signatureResult = await signTransaction(
        Buffer.from(message).toString("base64"),
        { address }
      );

      if (signatureResult.error) {
        throw new Error(signatureResult.error);
      }

      // Step 3: Verify signature and accept invite
      const acceptResponse = await fetch(`/api/v3/org/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          nonce,
          signature: signatureResult.signedTxXdr,
        }),
      });

      if (!acceptResponse.ok) {
        const errorData = await acceptResponse.json();
        throw new Error(
          errorData.error || "Failed to accept invite"
        );
      }

      setStatus("accepted");
      setError("");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const handleRejectInvite = async () => {
    try {
      setStatus("loading");
      const response = await fetch(`/api/v3/org/invites/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to reject invite");

      setStatus("rejected");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to reject invite");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading State
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading your invitation...</p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (status === "error" || !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Invitation Error
            </h2>
            <p className="text-slate-300 mb-6">
              {error || "This invitation is invalid or has expired."}
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition"
            >
              Return Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success States
  if (status === "accepted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to {inviteData.orgName}!
          </h2>
          <p className="text-slate-400 mb-6">
            Your wallet has been verified. Redirecting to dashboard...
          </p>
          <div className="flex items-center justify-center gap-2 text-cyan-400">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Redirecting...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <XCircle className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Invitation Declined
          </h2>
          <p className="text-slate-400 mb-6">
            You have declined the invitation to join {inviteData.orgName}.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  // Main Ready/Verification States
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            You're Invited
          </h1>
          <p className="text-slate-400">
            Join your team and start collaborating
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Org & Role Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Organization Card */}
            <InviteOrgCard
              orgName={inviteData.orgName}
              orgLogo={inviteData.orgLogo}
              invitedBy={inviteData.invitedBy}
              invitedAt={inviteData.invitedAt}
            />

            {/* Role Preview Section */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Your Role: {inviteData.role}
              </h2>
              <RolePreviewCard role={inviteData.role} />
            </div>
          </motion.div>

          {/* Right Column: Action Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-6">
                Verification
              </h3>

              {/* Wallet Status */}
              <div className="mb-6 pb-6 border-b border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isConnected ? "bg-green-400" : "bg-yellow-400"
                    }`}
                  />
                  <span className="text-sm text-slate-300">
                    {isConnected ? "Wallet Connected" : "Connect Wallet"}
                  </span>
                </div>

                {isConnected && address ? (
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-500 mb-2">Connected Address:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-cyan-300 font-mono flex-1 truncate">
                        {address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(address)}
                        className="p-1 hover:bg-slate-800 rounded transition"
                        title="Copy address"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 mb-4"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </button>
                )}
              </div>

              {/* Verification Info */}
              <div className="mb-6 space-y-2 text-sm text-slate-400">
                <div className="flex gap-2">
                  <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>
                    We'll verify your wallet matches this invitation
                  </span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>No funds required, just a signature</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleVerifyAndAccept}
                  disabled={
                    !isConnected ||
                    status === "authenticating"
                  }
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {status === "authenticating" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Accept Invitation
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleRejectInvite}
                  className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition border border-slate-600 hover:border-slate-500"
                >
                  Decline
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <p className="text-sm text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-sm text-slate-500"
        >
          <p className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            This invitation will expire in 7 days
          </p>
        </motion.div>
      </div>
    </div>
  );
}
