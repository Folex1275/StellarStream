"use client";

/**
 * Example Usage: Elastic Micro-interaction Library
 * 
 * Demonstrates all three interaction patterns from Issue #520.
 * This file serves as a reference implementation and can be used
 * in the demo pages (e.g., /app/demo/interactions/page.tsx).
 */

import { useState } from "react";
import LongPressRadialMenu from "./long-press-radial-menu";
import BloomAnimationWrapper from "./bloom-animation-wrapper";
import MilestoneGlowEffect from "./milestone-glow-effect";

// Mock stream card component for demonstration
function MockStreamCard({ title, amount }: { title: string; amount: number }) {
  return (
    <div
      style={{
        padding: "24px",
        background: "rgba(0, 245, 255, 0.05)",
        border: "1px solid rgba(0, 245, 255, 0.2)",
        borderRadius: "12px",
        color: "#00f5ff",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
        ${amount.toLocaleString()}
      </p>
    </div>
  );
}

export default function InteractionExamples() {
  const [showBloom, setShowBloom] = useState(false);
  const [balance, setBalance] = useState(0);

  // Simulate balance increase for milestone demo
  const incrementBalance = () => {
    setBalance((prev) => prev + 1000);
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "#00f5ff", marginBottom: "40px" }}>
        Elastic Micro-interaction Library
      </h1>

      {/* Example 1: Long-Press Radial Menu */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ color: "#00f5ff", marginBottom: "16px" }}>
          1. Long-Press Radial Menu
        </h2>
        <p style={{ color: "#888", marginBottom: "24px" }}>
          Press and hold on the card for 400ms to reveal the radial menu.
        </p>

        <LongPressRadialMenu
          items={[
            {
              id: "withdraw",
              label: "💰",
              onSelect: () => alert("Withdraw selected"),
            },
            {
              id: "cancel",
              label: "❌",
              onSelect: () => alert("Cancel selected"),
            },
            {
              id: "topup",
              label: "➕",
              onSelect: () => alert("Top Up selected"),
            },
            {
              id: "share",
              label: "📤",
              onSelect: () => alert("Share selected"),
            },
          ]}
        >
          <MockStreamCard title="Salary Stream" amount={5000} />
        </LongPressRadialMenu>
      </section>

      {/* Example 2: Bloom Animation */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ color: "#00f5ff", marginBottom: "16px" }}>
          2. Bloom Animation (Success State)
        </h2>
        <p style={{ color: "#888", marginBottom: "24px" }}>
          Click the button to trigger the elastic bloom effect.
        </p>

        <button
          onClick={() => {
            setShowBloom(false);
            setTimeout(() => setShowBloom(true), 100);
          }}
          style={{
            padding: "12px 24px",
            background: "rgba(0, 245, 255, 0.2)",
            border: "1px solid rgba(0, 245, 255, 0.4)",
            borderRadius: "8px",
            color: "#00f5ff",
            cursor: "pointer",
            marginBottom: "24px",
          }}
        >
          Trigger Bloom Animation
        </button>

        <BloomAnimationWrapper show={showBloom}>
          <MockStreamCard title="New Stream Created!" amount={10000} />
        </BloomAnimationWrapper>
      </section>

      {/* Example 3: Milestone Glow */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ color: "#00f5ff", marginBottom: "16px" }}>
          3. Milestone Glow Effect
        </h2>
        <p style={{ color: "#888", marginBottom: "24px" }}>
          Click to increment balance. Watch for glow at 1000, 10000, 100000.
        </p>

        <button
          onClick={incrementBalance}
          style={{
            padding: "12px 24px",
            background: "rgba(0, 245, 255, 0.2)",
            border: "1px solid rgba(0, 245, 255, 0.4)",
            borderRadius: "8px",
            color: "#00f5ff",
            cursor: "pointer",
            marginBottom: "24px",
          }}
        >
          +1000 (Current: ${balance.toLocaleString()})
        </button>

        <MilestoneGlowEffect value={balance} milestones={[1000, 10000, 100000]}>
          <MockStreamCard title="Streaming Balance" amount={balance} />
        </MilestoneGlowEffect>
      </section>

      {/* Implementation Notes */}
      <section
        style={{
          padding: "24px",
          background: "rgba(0, 245, 255, 0.05)",
          border: "1px solid rgba(0, 245, 255, 0.2)",
          borderRadius: "12px",
        }}
      >
        <h3 style={{ color: "#00f5ff", marginTop: 0 }}>Implementation Notes</h3>
        <ul style={{ color: "#888", lineHeight: 1.8 }}>
          <li>All animations respect prefers-reduced-motion</li>
          <li>Haptic feedback on supported mobile devices</li>
          <li>Spring physics match Figma prototypes (Issue #520)</li>
          <li>Performance target: 60fps on all interactions</li>
          <li>Touch and mouse input supported</li>
        </ul>
      </section>
    </div>
  );
}
