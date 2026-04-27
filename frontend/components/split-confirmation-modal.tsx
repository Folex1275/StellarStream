"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  ArrowDownToLine, 
  CheckCircle2, 
  X, 
  Fuel, 
  Zap,
  Calculator,
  ExternalLink
} from "lucide-react";
import { useAutoPilot } from "@/lib/use-auto-pilot";
import { useGasBuffer } from "@/lib/use-gas-buffer";
import { toast } from "@/lib/toast";

interface Recipient {
  address: string;
  amount: string;
  share: number;
}

interface SplitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  recipients: Recipient[];
  requiredGasXlm: number;
  isConfirming?: boolean;
}

// Validation functions
const validateRecipients = (recipients: Recipient[]): boolean => {
  return recipients.every(r => 
    r.address.trim().length > 0 && 
    parseFloat(r.amount) > 0 && 
    r.share >= 0
  );
};

const validateRequiredGas = (requiredGasXlm: number): boolean => {
  return requiredGasXlm > 0 && requiredGasXlm < 1000; // Reasonable limits
};

export function SplitConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  recipients,
  requiredGasXlm,
  isConfirming = false,
}: SplitConfirmationModalProps) {
  const { status } = useGasBuffer();
  const { config, calculateGasRequirements, batchRefillForSplit, error: autoPilotError } = useAutoPilot();
  const [isBatchRefilling, setIsBatchRefilling] = useState(false);
  const [batchRefillCompleted, setBatchRefillCompleted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate inputs
  const isValidData = React.useMemo(() => {
    const validRecipients = validateRecipients(recipients);
    const validGas = validateRequiredGas(requiredGasXlm);
    
    if (!validRecipients) {
      setValidationError("Invalid recipient data. Please check addresses and amounts.");
      return false;
    }
    
    if (!validGas) {
      setValidationError("Invalid gas requirement. Please check the split configuration.");
      return false;
    }
    
    setValidationError(null);
    return true;
  }, [recipients, requiredGasXlm]);

  // Calculate gas requirements
  const gasCalculation = React.useMemo(() => {
    if (!isValidData) {
      return {
        requiredGas: 0,
        currentGas: status?.balanceXlm ?? 0,
        deficit: 0,
        needsRefill: false,
        suggestedRefillAmount: 0,
      };
    }
    return calculateGasRequirements(requiredGasXlm);
  }, [isValidData, requiredGasXlm, status, calculateGasRequirements]);

  const needsBatchRefill = gasCalculation.needsRefill && !batchRefillCompleted;

  const handleBatchRefill = useCallback(async () => {
    if (!isValidData) return;
    
    setIsBatchRefilling(true);
    try {
      const success = await batchRefillForSplit(requiredGasXlm);
      if (success) {
        setBatchRefillCompleted(true);
        toast.success({
          title: "Batch Refill Successful",
          description: `${gasCalculation.suggestedRefillAmount} XLM added to gas buffer.`,
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error({
        title: "Batch Refill Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsBatchRefilling(false);
    }
  }, [isValidData, requiredGasXlm, batchRefillForSplit, gasCalculation.suggestedRefillAmount]);

  const handleConfirmSplit = useCallback(async () => {
    if (!isValidData) {
      toast.error({
        title: "Validation Error",
        description: validationError || "Invalid split data",
        duration: 4000,
      });
      return;
    }

    if (needsBatchRefill && !batchRefillCompleted) {
      toast.error({
        title: "Insufficient Gas",
        description: "Please complete the batch refill first or enable Auto-Pilot.",
        duration: 4000,
      });
      return;
    }

    try {
      await onConfirm();
      onClose(); // Close modal on successful confirmation
    } catch (error) {
      toast.error({
        title: "Confirmation Failed",
        description: error instanceof Error ? error.message : "Failed to confirm split",
        duration: 5000,
      });
    }
  }, [isValidData, needsBatchRefill, batchRefillCompleted, onConfirm, onClose, validationError]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setBatchRefillCompleted(false);
      setValidationError(null);
    }
  }, [isOpen]);

  const totalAmount = recipients.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gray-950/40 p-1 shadow-2xl backdrop-blur-2xl"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 blur-[80px]" />

        <div className="relative p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                needsBatchRefill 
                  ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                  : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
              }`}>
                {needsBatchRefill ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-white">
                  {needsBatchRefill ? "Gas Required" : "Confirm Split"}
                </h3>
                <p className="font-body text-xs text-white/50">
                  {needsBatchRefill ? "Insufficient gas for this transaction" : "Review split details"}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Split Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-white/60">Recipients</span>
              <span className="font-body text-sm font-semibold text-white">{recipients.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-white/60">Total Amount</span>
              <span className="font-body text-sm font-semibold text-white">{totalAmount.toFixed(2)} XLM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-white/60">Required Gas</span>
              <span className="font-body text-sm font-semibold text-cyan-400">{requiredGasXlm.toFixed(4)} XLM</span>
            </div>
          </div>

          {/* Gas Analysis */}
          <div className={`rounded-2xl border p-4 space-y-3 ${
            needsBatchRefill 
              ? "border-orange-500/30 bg-orange-500/[0.05]" 
              : "border-emerald-500/30 bg-emerald-500/[0.05]"
          }`}>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-orange-400" />
              <span className="font-body text-xs font-semibold text-white">Gas Analysis</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-white/60">Current Balance</span>
                <span className="font-body text-sm font-mono text-white/80">
                  {gasCalculation.currentGas.toFixed(4)} XLM
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-white/60">Required</span>
                <span className={`font-body text-sm font-mono ${
                  needsBatchRefill ? "text-orange-400" : "text-emerald-400"
                }`}>
                  {gasCalculation.requiredGas.toFixed(4)} XLM
                </span>
              </div>
              {needsBatchRefill && (
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="font-body text-xs font-semibold text-orange-400">Deficit</span>
                  <span className="font-body text-sm font-bold text-orange-400">
                    {gasCalculation.deficit.toFixed(4)} XLM
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Pilot Status */}
          {config.enabled && (
            <div className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/[0.05] px-3 py-2">
              <Zap className="h-4 w-4 text-violet-400" />
              <span className="font-body text-xs text-violet-300">
                Auto-Pilot is enabled - Future splits will auto-refill
              </span>
            </div>
          )}

          {/* Batch Refill Section */}
          {needsBatchRefill && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.05] p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Fuel className="h-5 w-5 text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-body text-sm font-semibold text-white mb-1">Batch Refill Required</h4>
                  <p className="font-body text-xs text-white/60 mb-3">
                    Add {gasCalculation.suggestedRefillAmount} XLM to cover this split and future transactions.
                  </p>
                  
                  <button
                    onClick={handleBatchRefill}
                    disabled={isBatchRefilling}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isBatchRefilling ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Refilling...
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="h-4 w-4" />
                        Batch Refill {gasCalculation.suggestedRefillAmount} XLM
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-heading text-xs font-bold text-white/60 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmSplit}
              disabled={isConfirming || (needsBatchRefill && !batchRefillCompleted)}
              className={`flex-1 rounded-xl py-3 font-heading text-xs font-bold transition-all ${
                needsBatchRefill && !batchRefillCompleted
                  ? "border border-white/20 bg-white/5 text-white/40 cursor-not-allowed"
                  : "bg-cyan-400 text-black hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-40"
              }`}
            >
              {isConfirming ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black mr-2" />
                  Confirming...
                </>
              ) : (
                <>
                  {needsBatchRefill && !batchRefillCompleted ? "Complete Refill First" : "Confirm Split"}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
