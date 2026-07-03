export type AgentLogPayload = {
  sessionId: string;
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
};

const ENDPOINT = process.env.NEXT_PUBLIC_AGENT_LOG_INGEST_URL;
const SESSION_ID = process.env.NEXT_PUBLIC_AGENT_LOG_SESSION_ID ?? "local";

function sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ["otp", "token", "password", "email", "url", "secret", "identifier", "value", "connectionString"];
  for (const [key, val] of Object.entries(data)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      sanitized[key] = sanitizeData(val as Record<string, unknown>);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export function agentLog(payload: Omit<AgentLogPayload, "sessionId">) {
  if (typeof window === "undefined") return;
  if (!ENDPOINT) return;

  const sanitizedPayload = {
    ...payload,
    data: sanitizeData(payload.data),
  };
  const body = JSON.stringify({ sessionId: SESSION_ID, ...sanitizedPayload });

  // Prefer fetch w/ session header when allowed; fall back to beacon to avoid CORS/preflight issues.
  try {
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": SESSION_ID,
      },
      body,
      keepalive: true,
    }).catch(() => {
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
      }
    });
  } catch {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
    }
  }
}

