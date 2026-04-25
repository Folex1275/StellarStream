"use client";

import type { ReactNode } from "react";
import React from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import ChangelogModal, { useChangelogModal } from "@/components/changelog-modal";
import { SplitSyncBridge } from "@/components/dashboard/SplitSyncBridge";

function ChangelogProvider({ children }: { children: ReactNode }) {
  const { isOpen, open, close } = useChangelogModal();

  // Auto-open changelog on mount (if user hasn't seen it)
  React.useEffect(() => {
    if (isOpen) open();
  }, []);

  return (
    <>
      {children}
      <ChangelogModal isOpen={isOpen} onClose={close} />
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ChangelogProvider>
      <SplitSyncBridge>
        <DashboardShell>{children}</DashboardShell>
      </SplitSyncBridge>
    </ChangelogProvider>
  );
}
