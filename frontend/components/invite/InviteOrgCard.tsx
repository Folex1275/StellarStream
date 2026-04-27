"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Organization Invitation Card Component
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Displays organization identity and invitation context.
 * High-trust interface showing org name, logo, and who invited the user.
 */

import { motion } from "framer-motion";
import { Building2, UserCheck, Calendar } from "lucide-react";
import Image from "next/image";

interface InviteOrgCardProps {
  orgName: string;
  orgLogo?: string;
  invitedBy?: string;
  invitedAt: string;
}

export function InviteOrgCard({
  orgName,
  orgLogo,
  invitedBy,
  invitedAt,
}: InviteOrgCardProps) {
  const invitationDate = new Date(invitedAt);
  const formattedDate = invitationDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-sm">
        {/* Logo & Org Name Section */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-700">
          {/* Organization Logo/Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex-shrink-0"
          >
            {orgLogo ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-900">
                <Image
                  src={orgLogo}
                  alt={orgName}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-cyan-400" />
              </div>
            )}
          </motion.div>

          {/* Org Name & Welcome Text */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <h2 className="text-2xl font-bold text-white mb-1">
              Welcome to {orgName}
            </h2>
            <p className="text-slate-400">
              Join a collaborative team powered by Stellar
            </p>
          </motion.div>
        </div>

        {/* Invitation Details */}
        <div className="space-y-4">
          {/* Invited By */}
          {invitedBy && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3 text-sm"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <UserCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400">Invited by</p>
                <p className="text-white font-medium">{invitedBy}</p>
              </div>
            </motion.div>
          )}

          {/* Invitation Date */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400">Invitation sent</p>
              <p className="text-white font-medium">{formattedDate}</p>
            </div>
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 p-4 rounded-lg bg-green-500/5 border border-green-500/20"
          >
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
              <p className="text-sm text-green-300">
                <span className="font-medium">Verified Organization:</span>{" "}
                This invitation comes directly from {orgName}. Once you connect
                your wallet and verify your address, you'll be granted access
                immediately.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
