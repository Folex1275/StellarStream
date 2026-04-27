"use client";

// components/dashboard/SignatureProgress.tsx
// Issue #678 - Multi-Sig Transaction Status Tracker

import { useState, useEffect } from "react";
import { Horizon } from "@stellar/stellar-sdk";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

interface SignerStatus {
  address: string;
  hasSigned: boolean;
  signatureTime?: Date;
}

interface SignatureProgressProps {
  /** Transaction hash to track signatures for */
  transactionHash?: string;
  /** Account address for multi-sig account */
  accountAddress?: string;
  /** Required number of signatures (e.g., 2 for 2-of-3) */
  requiredSignatures: number;
  /** Total number of possible signers */
  totalSigners: number;
  /** Optional custom className */
  className?: string;
}

export function SignatureProgress({
  transactionHash,
  accountAddress,
  requiredSignatures,
  totalSigners,
  className = "",
}: SignatureProgressProps) {
  const [signers, setSigners] = useState<SignerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For demo purposes, we'll simulate signature fetching
  // In production, this would fetch from Horizon API or a backend service
  useEffect(() => {
    const fetchSignerStatus = async () => {
      if (!accountAddress && !transactionHash) return;

      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For now, create mock signer data
        // In real implementation, this would fetch from Horizon
        const mockSigners: SignerStatus[] = Array.from({ length: totalSigners }, (_, i) => ({
          address: `G${'A'.repeat(55 - i)}`,
          hasSigned: Math.random() > 0.6, // Randomly mark some as signed
          signatureTime: Math.random() > 0.6 ? new Date(Date.now() - Math.random() * 86400000) : undefined,
        }));

        setSigners(mockSigners);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch signature status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignerStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchSignerStatus, 30000);
    return () => clearInterval(interval);
  }, [accountAddress, transactionHash, totalSigners]);

  const signedCount = signers.filter(s => s.hasSigned).length;
  const progress = (signedCount / requiredSignatures) * 100;
  const isComplete = signedCount >= requiredSignatures;

  const unsignedSigners = signers.filter(s => !s.hasSigned);

  if (isLoading && signers.length === 0) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-sm text-white/60">Loading signature status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-red-400/20 bg-red-400/5 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-red-400">
          <XCircle className="h-4 w-4" />
          Failed to load signature status: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/80">Signatures</span>
          <span className="text-xs text-white/50">
            {signedCount} of {requiredSignatures} required
          </span>
        </div>
        {isComplete && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </div>
        )}
      </div>

      {/* Progress Ring */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg className="h-20 w-20 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            {/* Progress circle */}
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={isComplete ? "#00f5ff" : "#00f5ff80"}
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {signedCount}/{requiredSignatures}
            </span>
          </div>
        </div>
      </div>

      {/* Waiting for signers */}
      {unsignedSigners.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-white/50 uppercase tracking-wider">Waiting for signatures</div>
          {unsignedSigners.slice(0, 3).map((signer, index) => (
            <div key={signer.address} className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3 text-orange-400" />
              <span className="text-white/60">Waiting for</span>
              <span className="font-mono text-xs text-cyan-400">
                {signer.address.slice(0, 8)}...{signer.address.slice(-6)}
              </span>
            </div>
          ))}
          {unsignedSigners.length > 3 && (
            <div className="text-xs text-white/40">
              +{unsignedSigners.length - 3} more signers required
            </div>
          )}
        </div>
      )}

      {/* Signer Status Grid */}
      <div className="grid grid-cols-2 gap-2">
        {signers.map((signer, index) => (
          <div
            key={signer.address}
            className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
              signer.hasSigned
                ? "border-green-400/20 bg-green-400/5 text-green-400"
                : "border-white/10 bg-white/5 text-white/40"
            }`}
          >
            {signer.hasSigned ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-white/30" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-mono truncate">
                {signer.address.slice(0, 6)}...{signer.address.slice(-4)}
              </div>
              {signer.hasSigned && signer.signatureTime && (
                <div className="text-[10px] opacity-70">
                  {signer.signatureTime.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SignatureProgress;