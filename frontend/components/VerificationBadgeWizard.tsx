"use client";

/**
 * VerificationBadgeWizard.tsx
 * 
 * Multi-step wizard for organizations to submit verification credentials
 * and earn the "Gold Checkmark" trust score enhancement.
 * 
 * Steps:
 * 1. Organization Information (Official Website, Contact Email)
 * 2. Stellar.toml Validation (Automatic parsing and validation)
 * 3. Business Registration (Document upload)
 * 4. Review & Submit
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Globe,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  Shield,
  Loader2,
  ExternalLink,
  X,
} from "lucide-react";
import {
  fetchStellarToml,
  parseStellarToml,
  type TomlValidationResult,
} from "@/lib/stellar-toml-validator";
import {
  submitVerificationRequest,
  uploadBusinessDocument,
  type VerificationRequest,
} from "@/lib/verification-client";

type WizardStep = "org-info" | "toml-validation" | "business-doc" | "review" | "submitting" | "success";

const STEPS: { id: WizardStep; label: string; number: number }[] = [
  { id: "org-info", label: "Organization Info", number: 1 },
  { id: "toml-validation", label: "Stellar.toml", number: 2 },
  { id: "business-doc", label: "Business Registration", number: 3 },
  { id: "review", label: "Review & Submit", number: 4 },
];

interface VerificationBadgeWizardProps {
  onClose: () => void;
  initialStellarAddress?: string;
}

export default function VerificationBadgeWizard({
  onClose,
  initialStellarAddress = "",
}: VerificationBadgeWizardProps) {
  const [step, setStep] = useState<WizardStep>("org-info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [orgName, setOrgName] = useState("");
  const [officialWebsite, setOfficialWebsite] = useState("");
  const [stellarTomlLink, setStellarTomlLink] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [stellarAddress, setStellarAddress] = useState(initialStellarAddress);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [businessDoc, setBusinessDoc] = useState<File | null>(null);
  const [businessDocUrl, setBusinessDocUrl] = useState<string | null>(null);

  // TOML validation results
  const [tomlValidation, setTomlValidation] = useState<TomlValidationResult | null>(null);
  const [tomlValidating, setTomlValidating] = useState(false);

  // Submission result
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const canProceedToStep2 = orgName.trim() && officialWebsite.trim() && contactEmail.trim() && stellarAddress.trim();
  const canProceedToStep3 = tomlValidation?.isValid;
  const canProceedToStep4 = businessDocUrl !== null || businessDoc !== null;

  const handleTomlValidation = useCallback(async () => {
    if (!stellarTomlLink.trim()) {
      setError("Please provide a stellar.toml link");
      return;
    }

    setTomlValidating(true);
    setError(null);

    try {
      const tomlContent = await fetchStellarToml(stellarTomlLink);
      const result = parseStellarToml(tomlContent);
      setTomlValidation(result);

      if (!result.isValid) {
        setError("TOML validation failed. Please fix the errors below.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate TOML");
      setTomlValidation(null);
    } finally {
      setTomlValidating(false);
    }
  }, [stellarTomlLink]);

  const handleDocumentUpload = useCallback(async () => {
    if (!businessDoc) {
      setError("Please select a business registration document");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadedUrl = await uploadBusinessDocument(businessDoc);
      if (uploadedUrl) {
        setBusinessDocUrl(uploadedUrl);
      } else {
        setError("Document upload failed. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }, [businessDoc]);

  const handleSubmit = useCallback(async () => {
    setStep("submitting");
    setError(null);

    const requestData: VerificationRequest = {
      organizationName: orgName,
      officialWebsite,
      stellarTomlLink,
      businessRegistrationDocument: businessDocUrl || undefined,
      contactEmail,
      stellarAccountAddress: stellarAddress,
      additionalNotes: additionalNotes || undefined,
    };

    const result = await submitVerificationRequest(requestData);

    if (result.success && result.verificationId) {
      setVerificationId(result.verificationId);
      setStep("success");
    } else {
      setError(result.error || "Submission failed");
      setStep("review");
    }
  }, [orgName, officialWebsite, stellarTomlLink, businessDocUrl, contactEmail, stellarAddress, additionalNotes]);

  const handleNext = () => {
    setError(null);
    const stepOrder: WizardStep[] = ["org-info", "toml-validation", "business-doc", "review"];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    setError(null);
    const stepOrder: WizardStep[] = ["org-info", "toml-validation", "business-doc", "review"];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Verification Badge Request</h2>
              <p className="text-xs text-white/50">Earn the Gold Checkmark for your organization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {step !== "success" && step !== "submitting" && (
          <div className="px-6 py-4">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const isCompleted = i < currentStepIndex;
                const isActive = s.id === step;
                return (
                  <div key={s.id} className="flex flex-1 items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isCompleted
                            ? "bg-emerald-400 text-black"
                            : isActive
                            ? "bg-amber-400 text-black"
                            : "bg-white/10 text-white/30"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : s.number}
                      </div>
                      <span
                        className={`text-xs ${
                          isActive ? "text-white/80 font-semibold" : isCompleted ? "text-white/50" : "text-white/25"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="h-px flex-1 bg-white/10 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-6 overflow-hidden"
            >
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        <div className="px-6 pb-6 min-h-[320px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Organization Information */}
            {step === "org-info" && (
              <motion.div
                key="org-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 pt-2"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Organization Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corporation"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Official Website <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="url"
                      value={officialWebsite}
                      onChange={(e) => setOfficialWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Contact Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Stellar Account Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={stellarAddress}
                    onChange={(e) => setStellarAddress(e.target.value)}
                    placeholder="G..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 font-mono focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Stellar.toml Validation */}
            {step === "toml-validation" && (
              <motion.div
                key="toml-validation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 pt-2"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    stellar.toml URL <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type="url"
                        value={stellarTomlLink}
                        onChange={(e) => {
                          setStellarTomlLink(e.target.value);
                          setTomlValidation(null);
                        }}
                        placeholder="https://example.com/.well-known/stellar.toml"
                        className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                      />
                    </div>
                    <button
                      onClick={handleTomlValidation}
                      disabled={tomlValidating || !stellarTomlLink.trim()}
                      className="rounded-lg bg-amber-400/10 border border-amber-400/30 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {tomlValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Validate"
                      )}
                    </button>
                  </div>
                </div>

                {tomlValidation && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {tomlValidation.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                      <span className={`text-sm font-semibold ${tomlValidation.isValid ? "text-emerald-400" : "text-red-400"}`}>
                        {tomlValidation.isValid ? "Validation Passed" : "Validation Failed"}
                      </span>
                    </div>

                    {tomlValidation.orgName && (
                      <div className="text-xs text-white/60">
                        <span className="text-white/40">Organization:</span> {tomlValidation.orgName}
                      </div>
                    )}

                    {tomlValidation.authEndpoint && (
                      <div className="text-xs text-white/60">
                        <span className="text-white/40">Auth Endpoint:</span>{" "}
                        <span className="font-mono text-amber-400">{tomlValidation.authEndpoint}</span>
                      </div>
                    )}

                    {tomlValidation.currencies.length > 0 && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Currencies ({tomlValidation.currencies.length}):</div>
                        <div className="flex flex-wrap gap-1">
                          {tomlValidation.currencies.map((currency, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-white/10 px-2 py-1 text-xs font-mono text-white/70"
                            >
                              {currency.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {tomlValidation.warnings.length > 0 && (
                      <div className="space-y-1">
                        {tomlValidation.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-amber-300/80">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {tomlValidation.errors.length > 0 && (
                      <div className="space-y-1">
                        {tomlValidation.errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-red-300">
                            <X className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Business Registration */}
            {step === "business-doc" && (
              <motion.div
                key="business-doc"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 pt-2"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Business Registration Document <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setBusinessDoc(file);
                      }}
                      className="hidden"
                      id="business-doc-upload"
                    />
                    <label
                      htmlFor="business-doc-upload"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 px-6 py-12 cursor-pointer hover:border-amber-400/50 hover:bg-amber-400/5 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-white/30 mb-2" />
                      <span className="text-sm text-white/60">
                        {businessDoc ? businessDoc.name : "Click to upload document"}
                      </span>
                      <span className="text-xs text-white/30 mt-1">PDF, JPG, or PNG (max 10MB)</span>
                    </label>
                  </div>
                </div>

                {businessDoc && (
                  <button
                    onClick={handleDocumentUpload}
                    disabled={loading}
                    className="w-full rounded-lg bg-amber-400/10 border border-amber-400/30 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Document
                      </>
                    )}
                  </button>
                )}

                {businessDocUrl && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300">Document uploaded successfully</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Review & Submit */}
            {step === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 pt-2"
              >
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white/80 mb-3">Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-white/40">Organization:</span>
                      <p className="text-white/80 mt-0.5">{orgName}</p>
                    </div>
                    <div>
                      <span className="text-white/40">Website:</span>
                      <p className="text-white/80 mt-0.5 flex items-center gap-1">
                        {officialWebsite}
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                    <div>
                      <span className="text-white/40">Contact:</span>
                      <p className="text-white/80 mt-0.5">{contactEmail}</p>
                    </div>
                    <div>
                      <span className="text-white/40">Stellar Address:</span>
                      <p className="text-white/80 mt-0.5 font-mono">{stellarAddress.slice(0, 8)}...{stellarAddress.slice(-4)}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <span className="text-white/40 text-xs">stellar.toml:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs text-emerald-300">
                        Validated ({tomlValidation?.currencies.length || 0} currencies)
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <span className="text-white/40 text-xs">Business Document:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs text-emerald-300">Uploaded</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any additional information..."
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Submitting State */}
            {step === "submitting" && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4"
              >
                <Loader2 className="h-12 w-12 animate-spin text-amber-400" />
                <p className="text-sm text-white/60">Submitting your verification request...</p>
              </motion.div>
            )}

            {/* Success State */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 gap-4 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-emerald-400">Request Submitted!</h3>
                <p className="text-sm text-white/60 max-w-md">
                  Your verification request has been submitted successfully. Our team will review your application within 2-5 business days.
                </p>
                {verificationId && (
                  <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-2">
                    <span className="text-xs text-white/40">Verification ID:</span>
                    <p className="text-sm font-mono text-amber-400 mt-0.5">{verificationId}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step !== "success" && step !== "submitting" && (
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <button
              onClick={step === "org-info" ? onClose : handleBack}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === "org-info" ? "Cancel" : "Back"}
            </button>

            {step === "review" ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-2 text-sm font-bold text-black hover:bg-amber-300 transition-colors"
              >
                Submit Request
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={
                  (step === "org-info" && !canProceedToStep2) ||
                  (step === "toml-validation" && !canProceedToStep3) ||
                  (step === "business-doc" && !canProceedToStep4)
                }
                className="flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-2 text-sm font-bold text-black hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="flex justify-end border-t border-white/10 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg bg-emerald-400 px-6 py-2 text-sm font-bold text-black hover:bg-emerald-300 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
