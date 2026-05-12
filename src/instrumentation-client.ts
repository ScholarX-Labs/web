import * as Sentry from "@sentry/nextjs";

function hasReplayConsent(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("sentry:replay-consent") === "granted";
}

if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  console.error("Missing NEXT_PUBLIC_SENTRY_DSN — skipping Sentry.init for client instrumentation");
} else {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    sendDefaultPii: false,

    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,

    integrations: [
      ...(hasReplayConsent()
        ? [
            Sentry.replayIntegration({
              maskAllText: true,
              maskAllInputs: true,
              blockAllMedia: true,
            }),
          ]
        : []),
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
