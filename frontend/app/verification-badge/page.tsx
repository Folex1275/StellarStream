"use client";

/**
 * Verification Badge Request Page
 * 
 * Dedicated page for organizations to request the Gold Checkmark
 * verification badge through a professional multi-step wizard.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Info, ExternalLink, CheckCircle2 } from "lucide-react";
import VerificationBadgeWizard from "@/components/VerificationBadgeWizard";

export default function VerificationBadgePage() {
  const [showWizard, setShowWizard] = useState(false);

  const benefits = [
    {
      icon: ShieldCheck,
      title: "Enhanced Trust Score",
      description: "Verified organizations receive a higher trust score, increasing visibility in the ecosystem.",
    },
    {
      icon: Shield,
      title: "Gold Checkmark Badge",
      description: "Display the prestigious gold checkmark on your profile and streams.",
    },
    {
      icon: CheckCircle2,
      title: "Priority Support",
      description: "Access dedicated support channels and faster response times.",
    },
    {
      icon: Info,
      title: "Increased Credibility",
      description: "Build confidence with users through verified organizational identity.",
    },
  ];

  const requirements = [
    "Valid official website with accessible stellar.toml file",
    "Properly configured CURRENCIES section in stellar.toml",
    "AUTH_ENDPOINT for SEP-10 authentication (recommended)",
    "Business registration document (PDF, JPG, or PNG)",
    "Active Stellar account in good standing",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-400/10 border-2 border-amber-400/30 mb-6"
            >
              <ShieldCheck className="h-10 w-10 text-amber-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-bold text-white mb-4"
            >
              Verification Badge
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Earn the <span className="text-amber-400 font-semibold">Gold Checkmark</span> to demonstrate your organization's credibility and trustworthiness on StellarStream
            </motion.p>
          </div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-amber-400/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10">
                    <benefit.icon className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-400">{benefit.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Requirements Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Info className="h-6 w-6 text-amber-400" />
              Requirements
            </h2>
            <ul className="space-y-3">
              {requirements.map((req, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">{req}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* stellar.toml Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-sm p-8 mb-12"
          >
            <h2 className="text-xl font-bold text-white mb-4">
              What is stellar.toml?
            </h2>
            <p className="text-gray-300 mb-4">
              The <code className="px-2 py-1 rounded bg-white/10 text-cyan-400 text-sm">stellar.toml</code> file is a configuration file hosted on your organization's domain that provides important information about your Stellar integration. It's part of the Stellar Ecosystem Protocol (SEP).
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                <strong className="text-white">Location:</strong>{" "}
                <span className="font-mono">https://yourdomain.com/.well-known/stellar.toml</span>
              </p>
              <p>
                <strong className="text-white">Learn more:</strong>{" "}
                <a
                  href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  SEP-0001 Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center"
          >
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-lg font-bold text-black hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30"
            >
              <ShieldCheck className="h-6 w-6" />
              Start Verification Request
            </button>
            <p className="text-sm text-gray-400 mt-4">
              Estimated review time: 2-5 business days
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <VerificationBadgeWizard onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
}
