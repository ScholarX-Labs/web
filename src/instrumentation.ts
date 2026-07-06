import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    // Dynamic import to avoid loading Redis code on Edge or in unrelated contexts
    import("./lib/cache/shared-redis").then(({ getSharedRedisStatus }) => {
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
