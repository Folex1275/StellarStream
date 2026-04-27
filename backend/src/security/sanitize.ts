import { createRequire } from "node:module";

type UnknownRecord = Record<string, unknown>;
type Sanitizer = (input: string) => string;

const require = createRequire(import.meta.url);

let cachedSanitizer: Sanitizer | null = null;

function fallbackSanitize(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/[<>]/g, "");
}

function loadSanitizer(): Sanitizer {
  if (cachedSanitizer) {
    return cachedSanitizer;
  }

  try {
    const xssModule = require("xss") as { default?: (input: string) => string } | ((input: string) => string);
    const candidate = typeof xssModule === "function" ? xssModule : xssModule.default;
    if (typeof candidate === "function") {
      cachedSanitizer = candidate;
      return cachedSanitizer;
    }
  } catch {
    // Fall through to the built-in sanitizer when the dependency is unavailable.
  }

  cachedSanitizer = fallbackSanitize;
  return cachedSanitizer;
}

export function sanitizeText(input: string): string {
  return loadSanitizer()(input).trim();
}

export function sanitizeUnknown<T>(input: T): T {
  if (typeof input === "string") {
    return sanitizeText(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((value) => sanitizeUnknown(value)) as T;
  }

  if (input && typeof input === "object") {
    const record = input as UnknownRecord;
    const sanitized: UnknownRecord = {};

    for (const [key, value] of Object.entries(record)) {
      sanitized[key] = sanitizeUnknown(value);
    }

    return sanitized as T;
  }

  return input;
}
