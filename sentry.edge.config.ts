import * as Sentry from "@sentry/nextjs";

if (!process.env.SENTRY_DSN) {
  console.warn("Missing SENTRY_DSN — skipping Sentry.init for edge runtime");
} else {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    enableLogs: true,
  });
}
