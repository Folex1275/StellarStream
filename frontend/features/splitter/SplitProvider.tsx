"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export interface Recipient {
  id: string;
  address: string;
  amount: string; // Using string for precise decimal handling or BigInt conversion later
  share: number;  // Optional: for percentage-based splits
  label?: string;
}

interface SplitContextType {
  recipients: Recipient[];
  step: number;
  addRecipient: (recipient: Omit<Recipient, "id">) => void;
  removeRecipient: (id: string) => void;
  updateRecipient: (id: string, updates: Partial<Omit<Recipient, "id">>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  clearRecipients: () => void;
}

const SplitContext = createContext<SplitContextType | undefined>(undefined);

export function SplitProvider({ children }: { children: ReactNode }) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [step, setStep] = useState(1);

  const addRecipient = useCallback((recipient: Omit<Recipient, "id">) => {
    setRecipients((prev) => [
      ...prev,
      { ...recipient, id: crypto.randomUUID() },
    ]);
  }, []);

  const removeRecipient = useCallback((id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRecipient = useCallback((id: string, updates: Partial<Omit<Recipient, "id">>) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const nextStep = useCallback(() => setStep((s) => s + 1), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  
  const clearRecipients = useCallback(() => {
    setRecipients([]);
    setStep(1);
  }, []);

  const value = useMemo(
    () => ({
      recipients,
      step,
      addRecipient,
      removeRecipient,
      updateRecipient,
      setStep,
      nextStep,
      prevStep,
      clearRecipients,
    }),
    [recipients, step, addRecipient, removeRecipient, updateRecipient, nextStep, prevStep, clearRecipients]
  );

  return <SplitContext.Provider value={value}>{children}</SplitContext.Provider>;
}

export function useSplit() {
  const context = useContext(SplitContext);
  if (context === undefined) {
    throw new Error("useSplit must be used within a SplitProvider");
  }
  return context;
}
