import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
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
