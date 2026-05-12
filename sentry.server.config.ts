import * as Sentry from "@sentry/nextjs";

if (!process.env.SENTRY_DSN) {
  console.warn("Missing SENTRY_DSN — skipping Sentry.init for server runtime");
} else {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    sendDefaultPii: true,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    includeLocalVariables: true,

    enableLogs: true,
  });
}
