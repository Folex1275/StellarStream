"use client";

/**
 * V3XRayTour — Issue #1017
 * Guided onboarding tour for the /dashboard/v3/splitter page.
 * Triggers only on first visit (localStorage flag). Skip saves the preference.
 */

import { useEffect, useState } from "react";
import { Joyride, STATUS, type Step, type EventData } from "react-joyride";

const STORAGE_KEY = "v3_xray_tour_done";

const STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    skipBeacon: true,
    title: "Welcome to Splitter V3 👋",
    content:
      "This quick tour covers the three core concepts: the X-Ray flow, the Bulk Recipient Grid, and Multi-Sig approval. It takes about 60 seconds.",
  },
  {
    target: "[data-tour='xray-flow']",
    placement: "bottom",
    skipBeacon: true,
    title: "X-Ray Flow",
    content:
      "The simulation waterfall gives you an X-Ray view of every transfer leg — sender → protocol router → each recipient — including network and protocol fees, before you sign anything.",
  },
  {
    target: "[data-tour='bulk-grid']",
    placement: "right",
    skipBeacon: true,
    title: "Bulk Recipient Grid",
    content:
      "Paste addresses directly, import a CSV, or use fuzzy search against your org directory. The grid validates every row in real time so errors are caught before submission.",
  },
  {
    target: "[data-tour='multisig']",
    placement: "left",
    skipBeacon: true,
    title: "Multi-Sig Approval",
    content:
      "Institutional splits require a quorum of admin signatures before execution. The Pending Approvals queue tracks each signer's status and surfaces conflicts if a signer rejects.",
  },
];

export function V3XRayTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setRun(true);
    }
  }, []);

  const handleEvent = ({ status }: EventData) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(STORAGE_KEY, "1");
      setRun(false);
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      onEvent={handleEvent}
      options={{
        primaryColor: "#00f5ff",
        overlayColor: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        showProgress: true,
        buttons: ["back", "skip", "primary"],
      }}
      styles={{
        tooltip: { backgroundColor: "#0d1117", color: "#e2e8f0" },
        buttonBack: { color: "#94a3b8" },
        buttonSkip: { color: "#94a3b8", fontSize: 13 },
        buttonPrimary: {
          backgroundColor: "#00f5ff",
          color: "#030305",
          fontWeight: 700,
          borderRadius: 10,
        },
      }}
    />
  );
}
