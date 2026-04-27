"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Role Preview Card Component
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Displays role-specific permissions and capabilities for invited team members.
 */

import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle,
  Settings,
  Eye,
  Lock,
  Zap,
  BarChart3,
} from "lucide-react";

type CollaboratorRole = "Admin" | "Accountant" | "Viewer";

interface Permission {
  icon: React.ReactNode;
  label: string;
  description: string;
}

const ROLE_PERMISSIONS: Record<CollaboratorRole, Permission[]> = {
  Admin: [
    {
      icon: <Settings className="w-5 h-5 text-cyan-400" />,
      label: "Full Organization Control",
      description: "Manage all settings, members, and configurations",
    },
    {
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      label: "Create & Execute Streams",
      description: "Create, modify, and execute payment streams",
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-cyan-400" />,
      label: "Financial Oversight",
      description: "Access all reports, analytics, and transaction history",
    },
    {
      icon: <Shield className="w-5 h-5 text-cyan-400" />,
      label: "Security Management",
      description: "Configure security policies and member access levels",
    },
  ],
  Accountant: [
    {
      icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
      label: "Financial Management",
      description: "Create, modify, and manage payment streams",
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      label: "Execute Transactions",
      description: "Execute and approve scheduled payments",
    },
    {
      icon: <Eye className="w-5 h-5 text-amber-400" />,
      label: "View Reports",
      description: "Access financial reports and analytics",
    },
    {
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      label: "Limited Access",
      description: "Cannot modify settings or manage team members",
    },
  ],
  Viewer: [
    {
      icon: <Eye className="w-5 h-5 text-slate-400" />,
      label: "View Only",
      description: "Read-only access to streams and reports",
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-slate-400" />,
      label: "Analytics Access",
      description: "View detailed financial reports and dashboards",
    },
    {
      icon: <Lock className="w-5 h-5 text-slate-400" />,
      label: "No Edit Rights",
      description: "Cannot create, modify, or execute transactions",
    },
    {
      icon: <Shield className="w-5 h-5 text-slate-400" />,
      label: "Observer Status",
      description: "Receive notifications and stay informed",
    },
  ],
};

const ROLE_COLORS: Record<CollaboratorRole, string> = {
  Admin: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
  Accountant: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  Viewer: "from-slate-600/20 to-slate-700/20 border-slate-600/30",
};

const ROLE_BADGES: Record<CollaboratorRole, string> = {
  Admin: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
  Accountant: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  Viewer: "bg-slate-700/50 text-slate-300 border-slate-600/50",
};

interface RolePreviewCardProps {
  role: CollaboratorRole;
}

export function RolePreviewCard({ role }: RolePreviewCardProps) {
  const permissions = ROLE_PERMISSIONS[role];
  const bgColor = ROLE_COLORS[role];
  const badgeColor = ROLE_BADGES[role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div
        className={`bg-gradient-to-br ${bgColor} rounded-2xl p-6 border backdrop-blur-sm`}
      >
        {/* Role Badge */}
        <div className="mb-6 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${badgeColor}`}
          >
            <CheckCircle className="w-4 h-4" />
            {role}
          </span>
          <span className="text-xs text-slate-400">Role</span>
        </div>

        {/* Permissions Grid */}
        <div className="grid gap-4">
          {permissions.map((permission, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 mt-1">
                {permission.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white text-sm">
                  {permission.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {permission.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 pt-6 border-t border-white/10"
        >
          <p className="text-xs text-slate-400 flex items-start gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Permissions can be modified by organization admins at any time
            </span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
