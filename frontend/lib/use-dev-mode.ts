"use client";

import { useState, useEffect } from "react";

export function useDevMode() {
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("stellarStream_devMode");
    if (stored !== null) {
      setDevMode(JSON.parse(stored));
    }
  }, []);

  const updateDevMode = (value: boolean) => {
    setDevMode(value);
    localStorage.setItem("stellarStream_devMode", JSON.stringify(value));
  };

  return [devMode, updateDevMode] as const;
}