"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export interface SplitExecutedEvent {
  splitId: string;
  /** Anonymized sender address, e.g. "G...ABCD" */
  sender: string;
  amount: string;
  token: string;
  recipientCount: number;
  timestamp: string;
}

/** Truncates a Stellar address to "G...XXXX" format. */
export function anonymizeAddress(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 1)}...${address.slice(-4)}`;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
const MAX_FEED_SIZE = 20;

export function useSplitFeed() {
  const [events, setEvents] = useState<SplitExecutedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-split-feed");
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("SPLIT_EXECUTED", (raw: SplitExecutedEvent) => {
      const anonymized: SplitExecutedEvent = {
        ...raw,
        sender: anonymizeAddress(raw.sender),
      };
      setEvents((prev) => [anonymized, ...prev].slice(0, MAX_FEED_SIZE));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { events, connected };
}
