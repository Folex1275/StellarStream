"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { AuditLogDrawer } from "./AuditLogDrawer";
import { TransactionQueueProvider } from "@/lib/providers/TransactionQueueProvider";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);

  return (
    <TransactionQueueProvider>
    <div className="relative min-h-screen bg-[#030303] text-white overflow-hidden">
      {/* Fixed Nebula Glow Background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background: `
            radial-gradient(
              circle 600px at 10% 15%,
              rgba(0, 245, 255, 0.08) 0%,
              transparent 70%
            ),
            radial-gradient(
              circle 500px at 90% 85%,
              rgba(138, 0, 255, 0.06) 0%,
              transparent 60%
            )
          `,
        }}
      />

      {/* Content Wrapper */}
      <div className="relative z-10 flex min-h-screen">
        <Sidebar onOpenAuditLog={() => setIsAuditLogOpen(true)} />

        {/* Audit Log Drawer */}
        <AuditLogDrawer
          isOpen={isAuditLogOpen}
          onClose={() => setIsAuditLogOpen(false)}
        />

        {/* Main Content Area with 12-column Bento Grid */}
        <main className="flex-1 overflow-hidden">
          <div
            className="grid gap-6 p-5 md:px-8 md:py-8 pb-24 md:pb-8 pt-20 md:pt-8"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gridAutoFlow: "dense",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
    </TransactionQueueProvider>
  );
}
