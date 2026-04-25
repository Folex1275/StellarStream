"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import type { Stream } from "@/lib/contracts/stellarstream";
import { useFlowRate } from "@/lib/use-flow-rate";
import { useAssetDecimals } from "@/lib/use-asset-decimals";
import { useAssetPrice } from "@/lib/use-asset-price";
import { AnimatePresence } from "framer-motion";

const DIGIT_HEIGHT = 56;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type Token =
  | { type: "digit"; value: number }
  | { type: "static"; value: string };

function DigitRoller({ digit }: { digit: number }) {
  const spring = useSpring(digit, { stiffness: 180, damping: 22, mass: 0.6 });

  useEffect(() => {
    spring.set(digit);
  }, [digit, spring]);

  const y = useTransform(spring, (v) => -v * DIGIT_HEIGHT);

  return (
    <div
      style={{
        position: "relative",
        height: `${DIGIT_HEIGHT}px`,
        width: "0.62em",
        overflow: "hidden",
        display: "inline-block",
      }}
    >
      <motion.div style={{ y, willChange: "transform" }}>
        {DIGITS.map((d) => (
          <div
            key={d}
            style={{
              height: `${DIGIT_HEIGHT}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {d}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function StaticChar({ char }: { char: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: `${DIGIT_HEIGHT}px`,
        paddingBottom: "2px",
      }}
    >
      {char}
    </span>
  );
}

function Odometer({
  value,
  prefix = "$",
  decimals = 7,
  color = "#00f5ff",
}: {
  value: number;
  prefix?: string;
  decimals?: number;
  color?: string;
}) {
  const tokens = useMemo<Token[]>(() => {
    const num = isNaN(value) ? 0 : value;
    const [intPart, decPart = ""] = num.toFixed(decimals).split(".");
    const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const result: Token[] = [];
    for (const ch of prefix) result.push({ type: "static", value: ch });
    for (const ch of intWithCommas) {
      result.push(
        /\d/.test(ch)
          ? { type: "digit", value: parseInt(ch, 10) }
          : { type: "static", value: ch },
      );
    }
    result.push({ type: "static", value: "." });
    for (const ch of decPart)
      result.push({ type: "digit", value: parseInt(ch, 10) });
    return result;
  }, [value, prefix, decimals]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: `${DIGIT_HEIGHT}px`,
        fontWeight: 700,
        color,
        textShadow: `0 0 8px ${color}cc, 0 0 24px ${color}66, 0 0 56px ${color}33`,
        letterSpacing: "-0.02em",
        userSelect: "none",
      }}
    >
      {tokens.map((t, i) =>
        t.type === "digit" ? (
          <DigitRoller key={i} digit={t.value} />
        ) : (
          <StaticChar key={i} char={t.value} />
        ),
      )}
    </div>
  );
}

const CORNERS: Array<["top" | "bottom", "left" | "right"]> = [
  ["top", "left"],
  ["top", "right"],
  ["bottom", "left"],
  ["bottom", "right"],
];

export interface StreamingBalanceCardProps {
  initialValue?: number;
  rate?: number;
  prefix?: string;
  /** Override decimal places. When `stream` is provided and assetIssuer is set,
   *  decimals are fetched dynamically from Stellar Horizon. */
  decimals?: number;
  color?: string;
  /** Pass a live contract Stream to derive balance and rate automatically */
  stream?: Stream | null;
  /** Asset code for dynamic decimal lookup (e.g. "USDC") */
  assetCode?: string;
  /** Asset issuer for dynamic decimal lookup. Omit for native XLM. */
  assetIssuer?: string;
}

export default function StreamingBalanceCard({
  initialValue = 48291.3847291,
  rate = 0.0000247,
  prefix = "$",
  decimals: decimalsProp,
  color = "#00f5ff",
  stream,
  assetCode,
  assetIssuer,
}: StreamingBalanceCardProps) {
  // Fetch decimals from Stellar Horizon when asset info is provided
  const { decimals: fetchedDecimals } = useAssetDecimals(assetCode, assetIssuer);
  // Explicit prop wins; otherwise use dynamically fetched value
  const decimals = decimalsProp ?? fetchedDecimals;

  // If a contract stream is provided, derive rate and initial balance from it
  const flowRate = useFlowRate(stream, decimals);
  const resolvedInitial = stream ? flowRate.balance : initialValue;
  const resolvedRate = stream ? flowRate.ratePerMs : rate;

  const [balance, setBalance] = useState(resolvedInitial);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number | null>(null);
  const baseBalanceRef = useRef(resolvedInitial);
  const baseTimeRef = useRef(performance.now());

  // Smoothly sync balance when stream data changes (e.g. new block confirmed)
  // Instead of jumping, we adjust the base reference point
  useEffect(() => {
    if (stream) {
      const now = performance.now();
      const currentProjected = baseBalanceRef.current + resolvedRate * (now - baseTimeRef.current);
      const diff = Math.abs(currentProjected - flowRate.balance);
      
      // Only adjust if the difference is significant (> 0.1% or > 0.0001 tokens)
      // This prevents micro-adjustments from causing visual jitter
      if (diff > Math.max(flowRate.balance * 0.001, 0.0001)) {
        // Smoothly transition to the new balance by updating the base reference
        baseBalanceRef.current = flowRate.balance;
        baseTimeRef.current = now;
        setBalance(flowRate.balance);
      }
    }
  }, [stream, flowRate.balance, resolvedRate]);

  useEffect(() => {
    // Reset animation state when rate changes
    baseBalanceRef.current = resolvedInitial;
    baseTimeRef.current = performance.now();
    setBalance(resolvedInitial);
    lastRef.current = null;

    const tick = (ts: number) => {
      if (lastRef.current !== null) {
        const delta = ts - lastRef.current;
        setBalance((b) => b + resolvedRate * delta);
      }
      lastRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [resolvedRate, resolvedInitial]);

  const { price, justUpdated, isLoading: isPriceLoading } = useAssetPrice(assetCode || "XLM");
  const [view, setView] = useState<"native" | "usd">("usd");

  const displayValue = view === "usd" && price !== null ? balance * price : balance;
  const displayPrefix = view === "usd" ? "$" : "";
  const displayDecimals = view === "usd" ? 2 : decimals;
  const displayAssetCode = view === "native" ? (assetCode || "XLM") : "USD";

  return (
    <div
      style={{
        padding: "32px 48px",
        border: `1px solid ${color}33`,
        borderRadius: "16px",
        background: "#030303",
        boxShadow: `0 0 0 1px ${color}11, 0 8px 32px rgba(0,0,0,0.5), 0 0 60px ${color}12, inset 0 1px 0 ${color}18, inset 0 0 40px ${color}07`,
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
      }}
      onClick={() => setView((v) => (v === "native" ? "usd" : "native"))}
    >
      {CORNERS.map(([v, h]) => (
        <div
          key={`${v}-${h}`}
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            [v]: -1,
            [h]: -1,
            borderTop: v === "top" ? `1px solid ${color}80` : "none",
            borderBottom: v === "bottom" ? `1px solid ${color}80` : "none",
            borderLeft: h === "left" ? `1px solid ${color}80` : "none",
            borderRight: h === "right" ? `1px solid ${color}80` : "none",
          }}
        />
      ))}
      
      <div style={{ position: "relative" }}>
        <Odometer
          value={displayValue}
          prefix={displayPrefix}
          decimals={displayDecimals}
          color={color}
        />
        
        {/* Pulse Indicator from Oracle */}
        <AnimatePresence>
          {justUpdated && view === "usd" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 2, 1], opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: 1 }}
              style={{
                position: "absolute",
                top: -10,
                right: -20,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 15px ${color}`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: `${color}88`, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {displayAssetCode}
          </span>
          {isPriceLoading && view === "usd" && (
            <span style={{ fontSize: "10px", color: `${color}44`, animation: "pulse 2s infinite" }}>
              Oracle Sync...
            </span>
          )}
        </div>
        
        <div style={{ fontSize: "10px", color: `${color}66`, fontWeight: 500 }}>
          CLICK TO TOGGLE VIEW
        </div>
      </div>

      {justUpdated && view === "usd" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute",
            bottom: -20,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "10px",
            color,
            fontWeight: "bold",
            letterSpacing: "0.05em",
          }}
        >
          ORACLE UPDATED
        </motion.div>
      )}
    </div>
  );
}
