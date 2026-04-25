import * as Sentry from "@sentry/browser";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const RELEASE = process.env.NEXT_PUBLIC_APP_RELEASE || "nebula-2.0.0";

export function initErrorTracking() {
  if (!SENTRY_DSN) {
    console.info("Sentry DSN not configured; frontend error tracking is disabled.");
    return;
  }

  if (Sentry.getClient()) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: RELEASE,
    tracesSampleRate: 0.25,
  });

  window.addEventListener("error", (event) => {
    Sentry.captureException(event.error || new Error("Unknown error event"));
  });

  window.addEventListener("unhandledrejection", (event) => {
    Sentry.captureException(event.reason || new Error("Unhandled promise rejection"));
  });
}

export function captureError(error: unknown) {
  if (SENTRY_DSN) {
    Sentry.captureException(error);
  }
}
