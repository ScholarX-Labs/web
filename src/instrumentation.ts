import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    // Dynamic import to avoid loading Redis code on Edge or in unrelated contexts.
    // Delay slightly so the Redis client has had a chance to start connecting
    // before we read the status — the client is created lazily on first access.
    import("./lib/cache/shared-redis").then(async ({ getSharedRedisStatus, isSharedRedisConfigured, getSharedRedisClient }) => {
      // Trigger client creation so the status reflects an actual attempt.
      if (isSharedRedisConfigured()) {
        getSharedRedisClient(); // creates the client; status may still be "connecting"
      }

      // Wait up to 5 s for the client to reach "ready" before logging the
      // diagnostic, so the Circuit Open line is meaningful rather than always
      // reporting "Healthy" before the TLS handshake finishes.
      const READY_TIMEOUT_MS = 5_000;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, READY_TIMEOUT_MS);
        const client = isSharedRedisConfigured() ? getSharedRedisClient() : null;
        if (!client || client.status === "ready") {
          clearTimeout(timer);
          resolve();
          return;
        }
        client.once("ready", () => { clearTimeout(timer); resolve(); });
        client.once("error", () => { clearTimeout(timer); resolve(); });
      });

      const status = getSharedRedisStatus();
      console.log("==================================================");
      console.log("🔍 REDIS DIAGNOSTICS [Server Boot]");
      console.log("==================================================");
      console.log(`Enabled (Overall): ${status.enabled ? "✅ YES" : "❌ NO"}`);
      console.log(`Cache Enabled:     ${status.cacheEnabled ? "✅ YES" : "❌ NO"}`);
      console.log(`Configured:        ${status.configured ? "✅ YES" : "❌ NO"}`);
      console.log(`Provider:          ${status.provider}`);
      if (status.host) {
        console.log(`Instance:          ${status.host}:${status.port}`);
      }
      
      if (status.configured) {
        console.log(`Circuit Open:      ${status.circuitOpen ? "⚠️ YES (Redis is unreachable)" : "✅ NO (Healthy)"}`);
        if (status.lastFailureAt) {
          console.log(`Last Failure:      ${status.lastFailureAt} (Context: ${status.lastFailureContext})`);
        }
      }
      console.log("==================================================");
    }).catch(err => console.error("Failed to load Redis diagnostics", err));
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = (
  ...args: Parameters<typeof Sentry.captureRequestError>
) => {
  const [error, request, context] = args;
  const maybeRequest = request as {
    method?: string;
    path?: string;
    url?: string;
  };
  const maybeContext = context as {
    routePath?: string;
    routerKind?: string;
    routeType?: string;
  };

  console.error("[NextRequestError]", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    method: maybeRequest.method,
    path: maybeRequest.path ?? maybeRequest.url,
    routePath: maybeContext.routePath,
    routerKind: maybeContext.routerKind,
    routeType: maybeContext.routeType,
  });

  return Sentry.captureRequestError(...args);
};
