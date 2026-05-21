import * as Sentry from "@sentry/nextjs";

if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  console.error("Missing NEXT_PUBLIC_SENTRY_DSN — skipping Sentry.init for client instrumentation");
} else {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    sendDefaultPii: false,

    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // replaysSessionSampleRate: record 10% of all sessions
    // replaysOnErrorSampleRate: always record a session when an error occurs
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,

    integrations: [
      // Always register the replay integration — the sample rates above control
      // when recording actually starts. Without this integration being present,
      // replaysSessionSampleRate and replaysOnErrorSampleRate have no effect.
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
